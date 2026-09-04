import logging

import firebase_admin
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth, exceptions


_bearer_scheme = HTTPBearer(
    auto_error=False,
    description="Firebase ID Token",
)
logger = logging.getLogger("heartquest.auth")


def _authentication_failed() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired Firebase ID token",
        headers={"WWW-Authenticate": "Bearer"},
    )


def _authentication_service_unavailable() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Authentication service is temporarily unavailable",
    )


def _get_firebase_app():
    try:
        return firebase_admin.get_app()
    except ValueError:
        try:
            return firebase_admin.initialize_app()
        except Exception as exc:
            logger.error(
                "Firebase initialization failed (%s)",
                type(exc).__name__,
            )
            raise _authentication_service_unavailable() from exc


def verify_firebase_id_token(id_token: str) -> str:
    try:
        decoded_token = auth.verify_id_token(
            id_token,
            app=_get_firebase_app(),
            check_revoked=True,
        )
    except (
        auth.InvalidIdTokenError,
        auth.ExpiredIdTokenError,
        auth.RevokedIdTokenError,
        auth.UserDisabledError,
        auth.UserNotFoundError,
        ValueError,
    ) as exc:
        raise _authentication_failed() from exc
    except exceptions.FirebaseError as exc:
        logger.warning(
            "Firebase token verification unavailable (%s)",
            type(exc).__name__,
        )
        raise _authentication_service_unavailable() from exc

    uid = decoded_token.get("uid")
    if not isinstance(uid, str) or not uid:
        raise _authentication_failed()

    return uid


def get_current_firebase_uid(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> str:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase ID token is required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return verify_firebase_id_token(credentials.credentials)
