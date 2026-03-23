import os
import secrets
import urllib.parse

import requests
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session

from database import get_db
from services.auth_service import (
    AUTH_SESSION_COOKIE,
    create_auth_token,
    get_optional_auth_session,
    get_or_create_user_from_google,
)

router = APIRouter()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"
GOOGLE_STATE_COOKIE = "google_oauth_state"


def _cookie_settings(request: Request) -> dict:
    forwarded_proto = request.headers.get("x-forwarded-proto", "")
    is_https = request.url.scheme == "https" or forwarded_proto == "https"
    return {
        "httponly": True,
        "secure": is_https,
        "samesite": "none" if is_https else "lax",
        "path": "/",
    }


def _google_redirect_uri(request: Request) -> str:
    env_redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
    if env_redirect_uri:
        return env_redirect_uri

    forwarded_proto = request.headers.get("x-forwarded-proto")
    forwarded_host = request.headers.get("x-forwarded-host")
    if forwarded_proto and forwarded_host:
        return f"{forwarded_proto}://{forwarded_host}/api/auth/google/callback"

    return str(request.url_for("google_callback"))


def _require_google_env() -> tuple[str, str]:
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    return client_id, client_secret


@router.get("/google/login")
def google_login(request: Request):
    client_id, _ = _require_google_env()

    state = secrets.token_urlsafe(24)
    redirect_uri = _google_redirect_uri(request)

    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }

    auth_url = f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"
    response = RedirectResponse(url=auth_url, status_code=302)
    response.set_cookie(
        key=GOOGLE_STATE_COOKIE,
        value=state,
        max_age=600,
        **_cookie_settings(request),
    )
    return response


@router.get("/google/callback", name="google_callback")
def google_callback(
    request: Request,
    code: str,
    state: str,
    db: Session = Depends(get_db),
):
    client_id, client_secret = _require_google_env()

    expected_state = request.cookies.get(GOOGLE_STATE_COOKIE)
    if not expected_state or expected_state != state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")

    redirect_uri = _google_redirect_uri(request)
    token_response = requests.post(
        GOOGLE_TOKEN_URL,
        data={
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        },
        timeout=20,
    )

    if not token_response.ok:
        raise HTTPException(status_code=400, detail="Google token exchange failed")

    token_data = token_response.json()
    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="Missing access token")

    userinfo_response = requests.get(
        GOOGLE_USERINFO_URL,
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=20,
    )
    if not userinfo_response.ok:
        raise HTTPException(status_code=400, detail="Google user info failed")

    profile = userinfo_response.json()
    google_sub = profile.get("sub")
    email = profile.get("email")
    name = profile.get("name")

    if not google_sub or not email:
        raise HTTPException(status_code=400, detail="Invalid Google profile")

    user = get_or_create_user_from_google(
        db=db,
        google_sub=google_sub,
        email=email,
        name=name,
    )

    auth_token = create_auth_token(user, provider="google")
    response = RedirectResponse(url=f"{FRONTEND_URL}/lti", status_code=302)
    response.delete_cookie(key=GOOGLE_STATE_COOKIE, path="/")
    response.set_cookie(
        key=AUTH_SESSION_COOKIE,
        value=auth_token,
        max_age=60 * 60 * 24 * 30,
        **_cookie_settings(request),
    )
    return response


@router.get("/session")
def auth_session(request: Request):
    session = get_optional_auth_session(request)
    if not session:
        return {"authenticated": False}

    return {
        "authenticated": True,
        "provider": session.provider,
        "user_id": session.user_id,
        "user_name": session.name,
        "user_email": session.email,
    }


@router.post("/logout")
def logout(request: Request):
    response = JSONResponse({"message": "Logged out"})
    response.delete_cookie(key=AUTH_SESSION_COOKIE, path="/")
    return response
