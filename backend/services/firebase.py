import firebase_admin
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth


_bearer_scheme = HTTPBearer(
    auto_error=False,
    description="Firebase ID Token",
)


def _get_firebase_app():
    try:
        return firebase_admin.get_app()
    except ValueError:
        return firebase_admin.initialize_app()


def verify_firebase_id_token(id_token: str) -> str:
    try:
        decoded_token = auth.verify_id_token(id_token, app=_get_firebase_app())
    except (auth.InvalidIdTokenError, auth.ExpiredIdTokenError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase ID token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    uid = decoded_token.get("uid")
    if not isinstance(uid, str) or not uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase ID token does not contain a valid uid",
            headers={"WWW-Authenticate": "Bearer"},
        )

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
