"""
LTI 1.0/1.1 routes for agentic-content-flow.
Provides:
  - POST /api/lti/launch          — General LTI login (redirects to app root)
  - POST /api/lti/exercise/{id}   — Exercise-specific LTI launch
  - POST /api/lti/submit-grade    — Submit grade back to LMS
  - GET  /api/lti/session         — Get current LTI session info
  - GET  /api/lti/credentials     — List LTI credentials
  - POST /api/lti/credentials     — Create new LTI credentials
"""
import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse, HTMLResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.lti_credential import LTICredential
from models.lti_session import LTISession
from services.lti_service import (
    is_lti_launch,
    verify_lti_signature,
    create_lti_session,
    get_lti_session,
    extract_user_info,
    extract_outcome_service,
    submit_grade,
)

router = APIRouter()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
LTI_SESSION_COOKIE = "lti_session_token"


# ---------------------------------------------------------------------------
# LTI Launch Endpoints
# ---------------------------------------------------------------------------

@router.post("/launch")
async def lti_launch(request: Request, db: Session = Depends(get_db)):
    """
    General LTI 1.0 launch endpoint.
    LMS sends a signed POST with LTI parameters.
    Validates OAuth signature, creates session, and redirects to frontend.
    """
    # Parse form data (LTI launches are form-encoded POST)
    form_data = await request.form()
    body = dict(form_data)

    if not is_lti_launch(body):
        raise HTTPException(status_code=400, detail="Not a valid LTI launch request")

    consumer_key = body.get("oauth_consumer_key", "")

    # Look up the consumer credentials
    credential = db.query(LTICredential).filter(
        LTICredential.consumer_key == consumer_key
    ).first()
    if not credential:
        raise HTTPException(status_code=403, detail="Unknown consumer key")

    # Verify OAuth signature
    request_url = str(request.url)
    # Use the forwarded URL if behind a proxy
    forwarded_proto = request.headers.get("x-forwarded-proto")
    forwarded_host = request.headers.get("x-forwarded-host")
    if forwarded_proto and forwarded_host:
        request_url = f"{forwarded_proto}://{forwarded_host}{request.url.path}"

    is_valid, error = verify_lti_signature(
        uri=request_url,
        http_method="POST",
        body=body,
        headers=dict(request.headers),
        db=db,
    )

    if not is_valid:
        print(f"LTI launch OAuth verification failed: {error}")
        raise HTTPException(status_code=403, detail=f"OAuth verification failed: {error}")

    # Create LTI session
    lti_session = create_lti_session(
        db=db,
        body=body,
        consumer_key=credential.consumer_key,
        consumer_secret=credential.consumer_secret,
    )

    user_info = extract_user_info(body)
    print(f"LTI launch successful for user: {user_info['name']} ({user_info['email']})")

    # Redirect to frontend with session cookie
    redirect_url = FRONTEND_URL
    response = RedirectResponse(url=redirect_url, status_code=303)
    response.set_cookie(
        key=LTI_SESSION_COOKIE,
        value=lti_session.session_token,
        max_age=86400,  # 24 hours
        httponly=True,
        samesite="none",
        secure=request.url.scheme == "https",
        path="/",
    )
    return response


@router.post("/exercise/{exercise_id}")
async def lti_exercise_launch(
    exercise_id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Exercise-specific LTI launch endpoint.
    Similar to /launch but scoped to a specific exercise (flow).
    The exercise_id maps to the exercise in the evaluation system.
    """
    form_data = await request.form()
    body = dict(form_data)

    if not is_lti_launch(body):
        raise HTTPException(status_code=400, detail="Not a valid LTI launch request")

    consumer_key = body.get("oauth_consumer_key", "")

    credential = db.query(LTICredential).filter(
        LTICredential.consumer_key == consumer_key
    ).first()
    if not credential:
        raise HTTPException(status_code=403, detail="Unknown consumer key")

    # Verify OAuth signature
    request_url = str(request.url)
    forwarded_proto = request.headers.get("x-forwarded-proto")
    forwarded_host = request.headers.get("x-forwarded-host")
    if forwarded_proto and forwarded_host:
        request_url = f"{forwarded_proto}://{forwarded_host}{request.url.path}"

    is_valid, error = verify_lti_signature(
        uri=request_url,
        http_method="POST",
        body=body,
        headers=dict(request.headers),
        db=db,
    )

    if not is_valid:
        print(f"LTI exercise launch OAuth verification failed: {error}")
        raise HTTPException(status_code=403, detail=f"OAuth verification failed: {error}")

    # Create LTI session with exercise context
    lti_session = create_lti_session(
        db=db,
        body=body,
        consumer_key=credential.consumer_key,
        consumer_secret=credential.consumer_secret,
        exercise_id=exercise_id,
    )

    user_info = extract_user_info(body)
    outcome = extract_outcome_service(body)
    print(f"LTI exercise launch: user={user_info['name']}, exercise={exercise_id}, "
          f"has_outcome_service={outcome is not None}")

    # Redirect to the exercise in the frontend
    redirect_url = f"{FRONTEND_URL}?exercise_id={exercise_id}"
    response = RedirectResponse(url=redirect_url, status_code=303)
    response.set_cookie(
        key=LTI_SESSION_COOKIE,
        value=lti_session.session_token,
        max_age=86400,
        httponly=True,
        samesite="none",
        secure=request.url.scheme == "https",
        path="/",
    )
    return response


# ---------------------------------------------------------------------------
# Session Info
# ---------------------------------------------------------------------------

@router.get("/session")
def get_session_info(request: Request, db: Session = Depends(get_db)):
    """Get current LTI session information."""
    session_token = request.cookies.get(LTI_SESSION_COOKIE)
    if not session_token:
        return {"authenticated": False}

    lti_session = get_lti_session(db, session_token)
    if not lti_session:
        return {"authenticated": False}

    return {
        "authenticated": True,
        "user_id": lti_session.user_id,
        "user_name": lti_session.user_name,
        "user_email": lti_session.user_email,
        "roles": lti_session.roles,
        "context_id": lti_session.context_id,
        "context_title": lti_session.context_title,
        "exercise_id": lti_session.exercise_id,
        "has_outcome_service": bool(
            lti_session.outcome_service_url and lti_session.result_sourcedid
        ),
    }


# ---------------------------------------------------------------------------
# Grade Submission
# ---------------------------------------------------------------------------

class GradeSubmission(BaseModel):
    points: float
    max_points: float


@router.post("/submit-grade")
def submit_grade_endpoint(
    grade_data: GradeSubmission,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Submit a grade back to the LMS via LTI Basic Outcomes.
    Requires an active LTI session with outcome service info.
    """
    session_token = request.cookies.get(LTI_SESSION_COOKIE)
    if not session_token:
        raise HTTPException(status_code=401, detail="No LTI session found")

    lti_session = get_lti_session(db, session_token)
    if not lti_session:
        raise HTTPException(status_code=401, detail="LTI session expired or invalid")

    if not lti_session.outcome_service_url or not lti_session.result_sourcedid:
        raise HTTPException(
            status_code=400,
            detail="No outcome service available - grade passback not supported for this launch"
        )

    result = submit_grade(
        outcome_service_url=lti_session.outcome_service_url,
        sourcedid=lti_session.result_sourcedid,
        score=grade_data.points,
        max_score=grade_data.max_points,
        consumer_key=lti_session.consumer_key,
        consumer_secret=lti_session.consumer_secret,
    )

    if result["success"]:
        print(f"Grade submitted: {grade_data.points}/{grade_data.max_points} "
              f"for user {lti_session.user_id}")
    else:
        print(f"Grade submission failed: {result.get('error')}")

    return result


# ---------------------------------------------------------------------------
# LTI Credential Management
# ---------------------------------------------------------------------------

class CredentialCreate(BaseModel):
    description: Optional[str] = ""


@router.get("/credentials")
def list_credentials(db: Session = Depends(get_db)):
    """List all LTI consumer credentials."""
    credentials = db.query(LTICredential).all()
    return [
        {
            "id": c.id,
            "consumer_key": c.consumer_key,
            "consumer_secret": c.consumer_secret,
            "description": c.description,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in credentials
    ]


@router.post("/credentials")
def create_credential(
    data: CredentialCreate,
    db: Session = Depends(get_db),
):
    """Create a new LTI consumer key/secret pair."""
    credential = LTICredential(
        consumer_key=LTICredential.generate_key(),
        consumer_secret=LTICredential.generate_secret(),
        description=data.description,
    )
    db.add(credential)
    db.commit()
    db.refresh(credential)

    return {
        "id": credential.id,
        "consumer_key": credential.consumer_key,
        "consumer_secret": credential.consumer_secret,
        "description": credential.description,
        "message": "LTI credentials created. Configure these in your LMS.",
        "launch_url": "/api/lti/launch",
        "exercise_launch_url_template": "/api/lti/exercise/{exercise_id}",
    }


@router.delete("/credentials/{credential_id}")
def delete_credential(credential_id: str, db: Session = Depends(get_db)):
    """Delete an LTI consumer credential."""
    credential = db.query(LTICredential).filter(
        LTICredential.id == credential_id
    ).first()
    if not credential:
        raise HTTPException(status_code=404, detail="Credential not found")

    db.delete(credential)
    db.commit()
    return {"message": "Credential deleted"}
