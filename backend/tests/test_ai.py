import copy
import json
import os
import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import httpx
from fastapi import HTTPException
from fastapi.testclient import TestClient


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from database import get_connection, init_database
from main import create_app
from services import ai


ANALYSIS = {
    "score": 8.5, "title": "散歩でひと息", "summary": "気分の変化が感じられました。",
    "insights": ["本人の評価は8でした。"], "next_action": "次回も無理のない範囲で。",
}
RECOMMENDATIONS = {"recommendations": [
    {"title": title, "description": "無理のない範囲で試しましょう。", "duration": "5分",
     "category": "休息", "source": source, "reason": "短時間で気分転換できます。"}
    for title, source in (("散歩", "classic"), ("空を眺める", "discovery"), ("音楽", "classic"))
]}


def envelope(result):
    return {"status": "completed", "output": [
        {"type": "reasoning", "summary": []},
        {"type": "message", "content": [{"type": "output_text", "text": json.dumps(result)}]},
    ]}


class AiApiTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.database_path = Path(directory.name) / "heartquest.db"
        init_database(self.database_path)
        with get_connection(self.database_path) as connection:
            self.user_id = connection.execute(
                "INSERT INTO users (firebase_uid, display_name) VALUES (?, ?)",
                ("firebase-user-secret", "private-profile@example.test"),
            ).lastrowid
            self.other_user_id = connection.execute(
                "INSERT INTO users (firebase_uid, display_name) VALUES (?, ?)",
                ("other-user-secret", "Other User"),
            ).lastrowid
        self.verify = self.enterContext(patch(
            "services.firebase.verify_firebase_id_token", return_value="firebase-user-secret",
        ))
        self.enterContext(patch.dict(os.environ, {
            "OPENAI_API_KEY": "test-only-provider-secret", "OPENAI_MODEL": "gpt-5.6-luna",
        }))
        self.client = self.enterContext(TestClient(create_app(self.database_path)))
        self.outbound = []
        self.result = ANALYSIS
        self.provider_status = 200
        self.provider_envelope = None
        self.on_request = None
        real_client = httpx.Client
        self.client_factory = self.enterContext(patch(
            "services.ai.httpx.Client",
            side_effect=lambda **kwargs: real_client(transport=httpx.MockTransport(self.respond), **kwargs),
        ))

    def respond(self, request):
        self.outbound.append(request)
        if self.on_request:
            self.on_request()
        return httpx.Response(
            self.provider_status,
            json=self.provider_envelope if self.provider_envelope is not None else envelope(self.result),
        )

    def post(self, route, payload):
        return self.client.post(route, headers={"Authorization": "Bearer test-only-firebase-token"}, json=payload)

    def recovery(self, user_id=None, **overrides):
        fields = {"activity": "散歩", "category": "運動", "before_mood": 3,
                  "before_state": "ふつう", "memo": "落ち着いた", "after_comment": "楽になった", "rating": 8}
        fields.update(overrides)
        with get_connection(self.database_path) as connection:
            return connection.execute(
                f"INSERT INTO recoveries (user_id, {', '.join(fields)}) VALUES ({', '.join('?' for _ in range(len(fields) + 1))})",
                (user_id or self.user_id, *fields.values()),
            ).lastrowid

    def input_data(self):
        return json.loads(json.loads(self.outbound[-1].content)["input"][0]["content"])

    def stored(self, recovery_id):
        with get_connection(self.database_path) as connection:
            return dict(connection.execute("SELECT * FROM recoveries WHERE id = ?", (recovery_id,)).fetchone())

    def test_recommend_uses_only_current_users_history_and_strict_schema(self):
        self.result = RECOMMENDATIONS
        self.recovery(activity="本人の記録")
        self.recovery(self.other_user_id, activity="他人の秘密の記録")
        response = self.post("/ai/recommend", {"current_mood": 2})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json(), RECOMMENDATIONS)
        self.verify.assert_called_once_with("test-only-firebase-token")
        data = self.input_data()
        self.assertEqual(data["current_mood"], 2)
        self.assertEqual([row["activity"] for row in data["history"]], ["本人の記録"])
        self.assertEqual(set(data["history"][0]), set(ai.RECOVERY_FIELDS))
        request = self.outbound[0]
        self.assertEqual(str(request.url), ai.OPENAI_RESPONSES_URL)
        self.assertEqual(request.headers["Authorization"], "Bearer test-only-provider-secret")
        body = json.loads(request.content)
        self.assertEqual(body["model"], "gpt-5.6-luna")
        self.assertIs(body["store"], False)
        self.assertNotIn("metadata", body)
        self.assertNotIn("user", body)
        self.assertNotIn("tools", body)
        format_config = body["text"]["format"]
        self.assertEqual(format_config["type"], "json_schema")
        self.assertIs(format_config["strict"], True)
        self.assertEqual(format_config["schema"], ai.Recommendations.model_json_schema())
        self.assertFalse(self.client_factory.call_args.kwargs["follow_redirects"])

    def test_history_is_bounded_and_newest_first(self):
        self.result = RECOMMENDATIONS
        for index in range(ai.HISTORY_LIMIT + 3):
            self.recovery(activity=f"記録{index}")
        self.assertEqual(self.post("/ai/recommend", {}).status_code, 200)
        history = self.input_data()["history"]
        self.assertEqual(len(history), ai.HISTORY_LIMIT)
        self.assertEqual(history[0]["activity"], "記録32")
        self.assertEqual(history[-1]["activity"], "記録3")

    def test_empty_history_is_allowed(self):
        self.result = RECOMMENDATIONS
        self.assertEqual(self.post("/ai/recommend", {}).status_code, 200)
        self.assertEqual(self.input_data(), {"current_mood": None, "history": []})

    def test_analyze_saves_validated_result_and_only_uses_earlier_own_history(self):
        self.recovery(activity="過去の本人の記録")
        other = self.recovery(self.other_user_id, activity="他人の記録")
        target = self.recovery()
        self.recovery(activity="分析対象より後の記録")
        response = self.post("/ai/analyze", {"recovery_id": target})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json(), ANALYSIS)
        self.assertEqual(self.input_data()["recovery"]["rating"], 8)
        self.assertEqual([x["activity"] for x in self.input_data()["history"]], ["過去の本人の記録"])
        self.assertEqual(self.stored(target)["ai_score"], 8.5)
        self.assertEqual(self.stored(target)["ai_comment"], ANALYSIS["summary"])
        self.assertIsNone(self.stored(other)["ai_score"])
        self.assertEqual(json.loads(self.outbound[0].content)["text"]["format"]["schema"], ai.Analysis.model_json_schema())

    def test_sensitive_values_are_removed_from_all_outbound_text_fields(self):
        secrets = ["firebase-user-secret", "test-only-firebase-token", "test-only-provider-secret",
                   "person@example.test", "sk-proj-SecretValue123456789",
                   "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJzZWNyZXQifQ.signature123"]
        dirty = "散歩 " + " ".join(secrets)
        prior = self.recovery(**{field: dirty for field in ai.RECOVERY_TEXT_LIMITS})
        target = self.recovery(**{field: dirty for field in ai.RECOVERY_TEXT_LIMITS})
        for route, payload, result in (
            ("/ai/recommend", {}, RECOMMENDATIONS),
            ("/ai/analyze", {"recovery_id": target}, ANALYSIS),
        ):
            with self.subTest(route=route):
                self.result = result
                with self.assertNoLogs("heartquest.ai", level="INFO"):
                    self.assertEqual(self.post(route, payload).status_code, 200)
                body = self.outbound[-1].content.decode()
                for secret in (*secrets, "private-profile@example.test", "other-user-secret"):
                    self.assertNotIn(secret, body)
                self.assertIn(ai.REDACTED, body)
        self.assertEqual(self.stored(prior)["memo"], dirty)
        self.assertEqual(self.stored(target)["memo"], dirty)

    def test_authentication_and_ownership_fail_before_any_ai_call(self):
        other = self.recovery(self.other_user_id)
        for route, payload in (("/ai/recommend", {}), ("/ai/analyze", {"recovery_id": other})):
            self.assertEqual(self.client.post(route, json=payload).status_code, 401)
        self.assertEqual(self.post("/ai/analyze", {"recovery_id": other}).status_code, 404)
        self.assertEqual(self.post("/ai/analyze", {"recovery_id": 99999}).status_code, 404)
        self.verify.side_effect = HTTPException(401, "Invalid token")
        self.assertEqual(self.post("/ai/recommend", {}).status_code, 401)
        self.verify.side_effect = None
        self.verify.return_value = "unregistered-user"
        self.assertEqual(self.post("/ai/recommend", {}).status_code, 404)
        self.assertEqual(self.post("/ai/analyze", {"recovery_id": other}).status_code, 404)
        self.assertEqual(self.outbound, [])

    def test_invalid_requests_and_unrated_recovery_never_reach_ai(self):
        unrated = self.recovery(rating=None)
        cases = [
            ("/ai/recommend", {"current_mood": value}) for value in (0, 6, "3", True)
        ] + [
            ("/ai/analyze", {"recovery_id": value}) for value in (0, -1, "1", True, unrated)
        ] + [
            ("/ai/recommend", {field: "private"})
            for field in ("firebase_uid", "user_id", "history", "email", "password", "model")
        ] + [("/ai/analyze", {"recovery_id": 1, "history": []})]
        for route, payload in cases:
            with self.subTest(route=route, payload=payload):
                self.assertEqual(self.post(route, payload).status_code, 422)
        self.assertEqual(self.outbound, [])

    def test_invalid_structured_analysis_is_never_saved(self):
        target = self.recovery()
        cases = [dict(ANALYSIS, score=value) for value in (0, 11, "8", True, float("nan"))]
        cases += [dict(ANALYSIS, extra="private"), dict(ANALYSIS, insights=[]), dict(ANALYSIS, title=" ")]
        missing = dict(ANALYSIS)
        del missing["summary"]
        cases.append(missing)
        for result in cases:
            with self.subTest(result=result):
                self.result = result
                self.assertEqual(self.post("/ai/analyze", {"recovery_id": target}).status_code, 502)
                self.assertIsNone(self.stored(target)["ai_score"])

    def test_invalid_recommendation_variety_is_rejected(self):
        same_source = copy.deepcopy(RECOMMENDATIONS)
        for item in same_source["recommendations"]:
            item["source"] = "classic"
        duplicate = copy.deepcopy(RECOMMENDATIONS)
        duplicate["recommendations"][1]["title"] = duplicate["recommendations"][0]["title"]
        for result in (same_source, duplicate, {"recommendations": []}):
            self.result = result
            self.assertEqual(self.post("/ai/recommend", {}).status_code, 502)

    def test_refusal_incomplete_and_malformed_outputs_do_not_overwrite_analysis(self):
        target = self.recovery(ai_score=7.0, ai_comment="previous result")
        cases = [
            ({"status": "incomplete", "output": []}, 502),
            ({"status": "completed", "output": [{"type": "message", "content": [{"type": "refusal", "refusal": "private"}]}]}, 422),
            ({"status": "completed", "output": []}, 502),
            ({"status": "completed", "output": [{"type": "message", "content": None}]}, 502),
            (envelope("free text"), 502),
            (envelope({}), 502),
        ]
        for body, status in cases:
            self.provider_envelope = body
            response = self.post("/ai/analyze", {"recovery_id": target})
            self.assertEqual(response.status_code, status)
            self.assertNotIn("private", response.text)
            self.assertEqual(self.stored(target)["ai_score"], 7.0)
            self.assertEqual(self.stored(target)["ai_comment"], "previous result")

    def test_upstream_errors_are_safe_and_are_not_retried(self):
        target = self.recovery()
        self.provider_envelope = {"error": {"message": "private-key-and-prompt"}}
        for upstream, expected in ((302, 502), (400, 502), (401, 503), (403, 503), (404, 503), (429, 429), (500, 502)):
            self.provider_status = upstream
            previous_count = len(self.outbound)
            with self.assertLogs("heartquest.ai", level="WARNING") as logs:
                response = self.post("/ai/analyze", {"recovery_id": target})
            self.assertEqual(response.status_code, expected)
            self.assertNotIn("private-key-and-prompt", response.text + str(logs.output))
            self.assertEqual(len(self.outbound), previous_count + 1)
            self.assertIsNone(self.stored(target)["ai_score"])

    def test_timeouts_and_connection_errors_are_safe(self):
        for error, expected in ((httpx.ReadTimeout("private"), 504), (httpx.ConnectError("private"), 503)):
            self.on_request = lambda: (_ for _ in ()).throw(error)
            with self.assertLogs("heartquest.ai", level="WARNING") as logs:
                response = self.post("/ai/recommend", {})
            self.assertEqual(response.status_code, expected)
            self.assertNotIn("private", response.text + str(logs.output))

    def test_missing_api_key_does_not_make_network_request(self):
        with patch.dict(os.environ, {"OPENAI_API_KEY": ""}):
            self.assertEqual(self.post("/ai/recommend", {}).status_code, 503)
        self.assertEqual(self.outbound, [])

    def test_database_error_does_not_leak_details_or_call_ai(self):
        with patch("api.ai.get_connection", side_effect=sqlite3.OperationalError("private-path")):
            with self.assertLogs("heartquest.ai", level="WARNING") as logs:
                response = self.post("/ai/recommend", {})
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("private-path", response.text + str(logs.output))
        self.assertEqual(self.outbound, [])

    def test_concurrent_edit_does_not_save_outdated_result(self):
        target = self.recovery()

        def edit():
            with get_connection(self.database_path) as connection:
                connection.execute("UPDATE recoveries SET rating = 2 WHERE id = ?", (target,))

        self.on_request = edit
        self.assertEqual(self.post("/ai/analyze", {"recovery_id": target}).status_code, 409)
        self.assertIsNone(self.stored(target)["ai_score"])
        self.assertEqual(self.stored(target)["rating"], 2)

    def test_retry_updates_same_record_without_creating_duplicate(self):
        target = self.recovery()
        self.provider_status = 500
        self.assertEqual(self.post("/ai/analyze", {"recovery_id": target}).status_code, 502)
        self.provider_status = 200
        self.assertEqual(self.post("/ai/analyze", {"recovery_id": target}).status_code, 200)
        with get_connection(self.database_path) as connection:
            self.assertEqual(connection.execute("SELECT COUNT(*) FROM recoveries").fetchone()[0], 1)


class AiPrivacyAndSchemaTests(unittest.TestCase):
    def test_redacts_private_keys_labels_emails_and_tokens(self):
        samples = [
            "-----BEGIN PRIVATE KEY-----\nvery-private\n-----END PRIVATE KEY-----",
            "-----BEGIN RSA PRIVATE KEY-----\nvery-private",
            "person+tag@example.test", "Bearer very-private", "AIzaVeryPrivate123",
            '"password": "very private with spaces"', "パスワードはvery-private",
            "firebase_uid=very-private", "APIキー：very-private", "access_token: very-private",
        ]
        for sample in samples:
            with self.subTest(sample=sample):
                self.assertEqual(ai.redact_text(sample).strip('"'), ai.REDACTED)

    def test_redaction_precedes_truncation(self):
        row = {field: None for field in ai.RECOVERY_FIELDS}
        row["memo"] = "a" * 1980 + "person@example.test"
        result = ai.recovery_input(row, ())
        self.assertNotIn("person", result["memo"])

    def test_output_schemas_are_strict_at_every_object(self):
        def check(node):
            if isinstance(node, dict):
                if node.get("type") == "object":
                    self.assertIs(node["additionalProperties"], False)
                    self.assertEqual(set(node["required"]), set(node["properties"]))
                for value in node.values():
                    check(value)
            elif isinstance(node, list):
                for value in node:
                    check(value)
        for model in (ai.Recommendations, ai.Analysis):
            check(model.model_json_schema())


if __name__ == "__main__":
    unittest.main()
