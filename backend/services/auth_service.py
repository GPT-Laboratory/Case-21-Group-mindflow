import os
from dataclasses import dataclass
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database import get_db
from models.auth_user import AuthUser


AUTH_SESSION_COOKIE = "acf_auth_token"
AUTH_ALGORITHM = "HS256"


@dataclass
class AuthSession:
    user_id: str
    email: str
    name: str
    provider: str


class AuthConfigError(RuntimeError):
    pass


def _get_auth_secret() -> str:
    secret = os.getenv("AUTH_JWT_SECRET") or os.getenv("NEXTAUTH_SECRET")
    if not secret:
        raise AuthConfigError("Missing AUTH_JWT_SECRET or NEXTAUTH_SECRET")
    return secret


def create_auth_token(user: AuthUser, provider: str = "google") -> str:
    secret = _get_auth_secret()
    payload = {
        "user_id": user.id,
        "email": user.email,
        "name": user.name or user.email,
        "provider": provider,
    }
    return jwt.encode(payload, secret, algorithm=AUTH_ALGORITHM)


def decode_auth_token(token: str) -> Optional[AuthSession]:
    try:
        secret = _get_auth_secret()
        payload = jwt.decode(token, secret, algorithms=[AUTH_ALGORITHM])
        return AuthSession(
            user_id=payload.get("user_id", ""),
            email=payload.get("email", ""),
            name=payload.get("name", "") or payload.get("email", ""),
            provider=payload.get("provider", "google"),
        )
    except Exception:
        return None


def get_optional_auth_session(request: Request) -> Optional[AuthSession]:
    token = request.cookies.get(AUTH_SESSION_COOKIE)
    if not token:
        return None
    session = decode_auth_token(token)
    if not session or not session.user_id:
        return None
    return session


def require_auth_session(request: Request) -> AuthSession:
    session = get_optional_auth_session(request)
    if not session:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return session


def get_or_create_user_from_google(
    db: Session,
    google_sub: str,
    email: str,
    name: Optional[str],
) -> AuthUser:
    user = db.query(AuthUser).filter(AuthUser.google_sub == google_sub).first()
    if user:
        user.email = email
        if name and not user.name:
            user.name = name
        db.commit()
        db.refresh(user)
        return user

    user_by_email = db.query(AuthUser).filter(AuthUser.email == email).first()
    if user_by_email:
        user_by_email.google_sub = google_sub
        if name and not user_by_email.name:
            user_by_email.name = name
        db.commit()
        db.refresh(user_by_email)
        return user_by_email

    user = AuthUser(
        email=email,
        name=name,
        google_sub=google_sub,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def require_authenticated_user(
    request: Request,
    db: Session = Depends(get_db),
) -> AuthUser:
    session = require_auth_session(request)
    user = db.query(AuthUser).filter(AuthUser.id == session.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user
