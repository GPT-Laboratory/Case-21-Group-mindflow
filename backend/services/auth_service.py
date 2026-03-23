import os
from dataclasses import dataclass
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database import get_db
from models.auth_user import AuthUser
from models.lti_session import LTISession


AUTH_SESSION_COOKIE = "acf_auth_token"
LTI_SESSION_COOKIE = "lti_session_token"
AUTH_ALGORITHM = "HS256"


@dataclass
class AuthSession:
    user_id: str
    email: str
    name: str
    provider: str


@dataclass
class CurrentUser:
    """Unified user identity from either Google or LTI auth."""
    user_id: str       # prefixed: "google:<id>" or "lti:<id>"
    email: str
    name: str
    provider: str      # "google" or "lti"
    role: str          # "instructor" or "student"


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


# ---------------------------------------------------------------------------
# Unified current-user resolution (Google or LTI)
# ---------------------------------------------------------------------------

def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> Optional[CurrentUser]:
    """Return a CurrentUser from whichever auth method is active, or None."""
    # Try Google auth first
    google_session = get_optional_auth_session(request)
    if google_session:
        return CurrentUser(
            user_id=f"google:{google_session.user_id}",
            email=google_session.email,
            name=google_session.name,
            provider="google",
            role="instructor",  # Google users are always instructors
        )

    # Try LTI session
    lti_token = request.cookies.get(LTI_SESSION_COOKIE)
    if lti_token:
        lti_session = db.query(LTISession).filter(
            LTISession.session_token == lti_token
        ).first()
        if lti_session:
            roles_str = (lti_session.roles or "").lower()
            role = "instructor" if "instructor" in roles_str else "student"
            return CurrentUser(
                user_id=f"lti:{lti_session.user_id}",
                email=lti_session.user_email or "",
                name=lti_session.user_name or "",
                provider="lti",
                role=role,
            )

    return None


def require_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> CurrentUser:
    """Require any authenticated user (Google or LTI)."""
    user = get_current_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


def require_instructor(
    request: Request,
    db: Session = Depends(get_db),
) -> CurrentUser:
    """Require an authenticated user with instructor role."""
    user = require_current_user(request, db)
    if user.role != "instructor":
        raise HTTPException(status_code=403, detail="Instructor access required")
    return user
