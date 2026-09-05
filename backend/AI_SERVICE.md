# AI通信サービス

既存のFirebase認証とSQLiteを使い、OpenAI Responses APIへ接続します。
モデルは `gpt-5.6-luna`、通信ライブラリは既存の `httpx` です。

## 起動設定

バックエンドを起動するプロセスの環境変数に `OPENAI_API_KEY` を設定してください。
`OPENAI_MODEL` は省略すると `gpt-5.6-luna` になります。
`backend/.env.example` は設定例であり、既存構成と同様に `.env` は自動読込しません。
キーはフロントエンド、`VITE_` 変数、Git、チャットへ入れないでください。

PowerShell 7では次のように履歴や画面に値を残さず入力できます。
既存のFirebase・DB・CORS設定を維持したうえで、同じPowerShellから起動します。

```powershell
cd backend
$env:OPENAI_API_KEY = Read-Host 'OpenAI Project API key' -MaskInput
$env:OPENAI_MODEL = 'gpt-5.6-luna'
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

キーが未設定ならAI APIだけが503を返します。認証や通常の回復記録APIは利用できます。
Projectでモデルの利用権限・課金枠が有効であることも必要です。

## API

どちらも `Authorization: Bearer <Firebase ID Token>` が必要です。
ユーザーIDや履歴をリクエストから指定することはできません。

- `POST /ai/recommend`：`{"current_mood": 3}`（現在の画面と同じ1〜5、省略・null可）
  - 本人の直近30件をDBから取得します。履歴が空でも提案できます。
  - `recommendations` に3件を返します。
  - 各件は `title`, `description`, `duration`, `category`, `source`, `reason`。
  - `source` は `classic` または `discovery` で、両方を含めます。
- `POST /ai/analyze`：`{"recovery_id": 1}`
  - 本人の評価済み記録と、その記録より前の本人の直近30件を使います。
  - `score`（1〜10）, `title`, `summary`, `insights`（1〜3件）, `next_action` を返します。
  - `score` と `summary` を既存の `ai_score`・`ai_comment` に保存します。
  - 詳細レポート全体は画面のセッション内で保持します。再読み込み後もスコアと要約は履歴に残ります。
  - 分析中に対象記録が変更・削除された場合は409を返し、古い入力に基づく分析を保存しません。

AI出力には `text.format.type=json_schema` と `strict=true` を指定します。
Pydanticから生成したJSON Schemaの全項目を必須にし、追加項目を禁止します。
バックエンドでも受信結果の型・範囲・提案の種類を検証します。

## AIへ渡す情報

回復履歴から明示的に取り出す項目は次だけです。

`activity`, `category`, `before_state`, `memo`, `after_comment`, `before_mood`, `after_mood`, `rating`

UID・DBのユーザーIDや記録ID・表示名・認証メール・Firebaseトークン・秘密鍵は
モデル入力の項目に含めません。Firebaseの認証ヘッダーをOpenAIへ転送しません。
OpenAIキーはOpenAIへのHTTP認証ヘッダーだけに使用します。
外部送信先は `https://api.openai.com/v1/responses` に固定し、リダイレクトを追跡しません。

自由入力は送信直前に、現在のUID・Firebaseトークン・設定済みOpenAIキーとの一致、
メールアドレス、JWT、Bearerトークン、OpenAI/Google形式のキー、PEM秘密鍵、
パスワード等のラベル付き記述を `[REDACTED]` に置換します。
除去してから文字数を制限し、元のSQLiteデータは書き換えません。
これは検出可能な情報の除去です。未知の形式の秘密情報や、ラベルのない任意のパスワードを
完全に検出するものではありません。ユーザーの了承に基づき自由入力も使用します。

入力文中の命令に従わないよう指示し、ツールは提供しません。
入力・認証情報・OpenAIエラー本文はアプリケーションログへ出力しません。
`store=false` を指定しますが、OpenAI側のすべての保持を無効にする設定ではありません。

## 失敗時と確認方法

接続タイムアウト5秒、読み書き等のタイムアウト45秒、出力上限4000トークン、
推論 effort は `low`。自動リトライは行いません。
通信失敗・拒否・不完全な応答・スキーマ違反は固定のエラーを返し、仮のAI結果を保存しません。
画面では保存完了とAI分析失敗を区別し、保存済み記録の分析だけを再試行します。

```powershell
cd backend
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

テストは一時SQLiteとFirebase/OpenAIのモックを使い、認証・ユーザー分離・機密情報除去・
Structured Outputs設定・保存・通信エラー・分析中の変更を確認します。実APIの課金は発生しません。
実環境ではログイン → AI提案 → 行動選択 → 10段階評価 → AI分析 → ホームの履歴・グラフを確認してください。

公式仕様：
[GPT-5.6 Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna)、
[Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)、
[APIデータの扱い](https://developers.openai.com/api/docs/guides/your-data)。
