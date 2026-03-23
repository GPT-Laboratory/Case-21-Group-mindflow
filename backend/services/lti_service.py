"""
LTI 1.0/1.1 service for OAuth signature verification and grade submission.
Based on patterns from css_artist and proj-s2025-educhat-part2 projects.
"""
import hashlib
import hmac
import os
import time
import uuid
import urllib.parse
from typing import Optional
from datetime import datetime, timedelta, timezone

import requests
from oauthlib.oauth1 import SignatureOnlyEndpoint, RequestValidator
from sqlalchemy.orm import Session

from models.lti_credential import LTICredential
from models.lti_nonce import LTINonce
from models.lti_session import LTISession


# ---------------------------------------------------------------------------
# OAuth 1.0 Request Validator (similar to educhat's LTIRequestValidator)
# ---------------------------------------------------------------------------

class LTIRequestValidator(RequestValidator):
    """Validates LTI OAuth 1.0 requests against stored credentials."""

    def __init__(self, db: Session):
        super().__init__()
        self.db = db
        self._cached_secrets = {}

    @property
    def enforce_ssl(self):
        return False

    @property
    def check_nonce(self):
        return True

    @property
    def dummy_client(self):
        return "DUMMY_KEY"

    @property
    def client_key_length(self):
        return (1, 256)

    @property
    def nonce_length(self):
        return (1, 256)

    def validate_client_key(self, client_key, request):
        cred = self.db.query(LTICredential).filter(
            LTICredential.consumer_key == client_key
        ).first()
        return cred is not None

    def get_client_secret(self, client_key, request):
        if client_key in self._cached_secrets:
            return self._cached_secrets[client_key]
        cred = self.db.query(LTICredential).filter(
            LTICredential.consumer_key == client_key
        ).first()
        if cred:
            self._cached_secrets[client_key] = cred.consumer_secret
            return cred.consumer_secret
        return "DUMMY_SECRET"

    def validate_timestamp_and_nonce(self, client_key, timestamp, nonce,
                                     request_token=None, access_token=None):
        if not client_key or not timestamp or not nonce:
            return False

        try:
            ts = int(timestamp)
        except (TypeError, ValueError):
            return False

        max_age_seconds = int(os.getenv("LTI_MAX_TIMESTAMP_AGE_SECONDS", "300"))
        now = int(time.time())
        if abs(now - ts) > max_age_seconds:
            return False

        existing_nonce = self.db.query(LTINonce).filter(
            LTINonce.consumer_key == client_key,
            LTINonce.nonce == nonce,
        ).first()
        if existing_nonce:
            return False

        nonce_record = LTINonce(
            consumer_key=client_key,
            nonce=nonce,
            oauth_timestamp=str(timestamp),
        )
        self.db.add(nonce_record)
        self.db.commit()
        return True

    def get_request_token_secret(self, client_key, token, request):
        return ""

    def get_access_token_secret(self, client_key, token, request):
        return ""


# ---------------------------------------------------------------------------
# OAuth Signature Verification
# ---------------------------------------------------------------------------

def verify_lti_signature(
    uri: str,
    http_method: str,
    body: dict,
    headers: dict,
    db: Session
) -> tuple[bool, Optional[str]]:
    """
    Verify OAuth 1.0 signature on an LTI launch request.
    Returns (is_valid, error_message).
    """
    validator = LTIRequestValidator(db)
    endpoint = SignatureOnlyEndpoint(validator)

    # Build the body string for oauthlib
    body_str = urllib.parse.urlencode(body, doseq=True)

    try:
        valid, _request = endpoint.validate_request(
            uri=uri,
            http_method=http_method.upper(),
            body=body_str,
            headers=headers
        )
        if not valid:
            return False, "Invalid OAuth signature"
        return True, None
    except Exception as e:
        return False, f"OAuth verification error: {str(e)}"


# ---------------------------------------------------------------------------
# LTI Data Extraction
# ---------------------------------------------------------------------------

def is_lti_launch(body: dict) -> bool:
    """Check if request body looks like an LTI 1.0 launch."""
    return (
        body.get("lti_version", "").startswith("LTI") or
        "oauth_consumer_key" in body
    )


def extract_user_info(body: dict) -> dict:
    """Extract user information from LTI launch parameters."""
    given = body.get("lis_person_name_given", "")
    family = body.get("lis_person_name_family", "")
    name = f"{given} {family}".strip()
    return {
        "user_id": body.get("user_id", ""),
        "name": name or body.get("user_id", "Unknown"),
        "email": body.get("lis_person_contact_email_primary", ""),
        "roles": body.get("roles", ""),
        "context_id": body.get("context_id", ""),
        "context_label": body.get("context_label", ""),
        "context_title": body.get("context_title", ""),
        "resource_link_id": body.get("resource_link_id", ""),
    }


def extract_outcome_service(body: dict) -> Optional[dict]:
    """Extract outcome service info for grade passback."""
    url = body.get("lis_outcome_service_url")
    sourcedid = body.get("lis_result_sourcedid")
    if url and sourcedid:
        return {
            "url": url,
            "sourcedid": sourcedid,
        }
    return None


# ---------------------------------------------------------------------------
# Session Management
# ---------------------------------------------------------------------------

def create_lti_session(
    db: Session,
    body: dict,
    consumer_key: str,
    consumer_secret: str,
    exercise_id: Optional[str] = None,
) -> LTISession:
    """Create a new LTI session record in the database."""
    user_info = extract_user_info(body)
    outcome = extract_outcome_service(body)

    session_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)

    lti_session = LTISession(
        session_token=session_token,
        user_id=user_info["user_id"],
        user_email=user_info["email"],
        user_name=user_info["name"],
        roles=user_info["roles"],
        context_id=user_info["context_id"],
        context_title=user_info["context_title"],
        resource_link_id=user_info["resource_link_id"],
        exercise_id=exercise_id,
        outcome_service_url=outcome["url"] if outcome else None,
        result_sourcedid=outcome["sourcedid"] if outcome else None,
        consumer_key=consumer_key,
        consumer_secret=consumer_secret,
        lti_data=body,
        expires_at=expires_at,
    )

    db.add(lti_session)
    db.commit()
    db.refresh(lti_session)
    return lti_session


def get_lti_session(db: Session, session_token: str) -> Optional[LTISession]:
    """Retrieve an active LTI session by token."""
    session = db.query(LTISession).filter(
        LTISession.session_token == session_token
    ).first()
    if session and session.expires_at:
        if session.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            return None
    return session


# ---------------------------------------------------------------------------
# Grade Submission (LTI Basic Outcomes)
# ---------------------------------------------------------------------------

def _build_outcomes_xml(sourcedid: str, score: float) -> str:
    """Build the XML payload for LTI Basic Outcomes replaceResult."""
    # Score must be 0.0 to 1.0
    normalized = max(0.0, min(1.0, score))
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<imsx_POXEnvelopeRequest xmlns="http://www.imsglobal.org/services/ltiv1p1/xsd/imsoms_v1p0">
  <imsx_POXHeader>
    <imsx_POXRequestHeaderInfo>
      <imsx_version>V1.0</imsx_version>
      <imsx_messageIdentifier>{int(time.time())}</imsx_messageIdentifier>
    </imsx_POXRequestHeaderInfo>
  </imsx_POXHeader>
  <imsx_POXBody>
    <replaceResultRequest>
      <resultRecord>
        <sourcedGUID>
          <sourcedId>{sourcedid}</sourcedId>
        </sourcedGUID>
        <result>
          <resultScore>
            <language>en</language>
            <textString>{normalized:.2f}</textString>
          </resultScore>
        </result>
      </resultRecord>
    </replaceResultRequest>
  </imsx_POXBody>
</imsx_POXEnvelopeRequest>"""


def _oauth_sign_request(url: str, method: str, body: str,
                        consumer_key: str, consumer_secret: str) -> dict:
    """Create OAuth 1.0 signed headers for a request (for grade submission)."""
    import hashlib
    import base64

    # Compute body hash (SHA1 of the body)
    body_hash = base64.b64encode(
        hashlib.sha1(body.encode("utf-8")).digest()
    ).decode("utf-8")

    # Build OAuth parameters
    oauth_params = {
        "oauth_consumer_key": consumer_key,
        "oauth_nonce": uuid.uuid4().hex,
        "oauth_signature_method": "HMAC-SHA1",
        "oauth_timestamp": str(int(time.time())),
        "oauth_version": "1.0",
        "oauth_body_hash": body_hash,
    }

    # Build signature base string
    encoded_params = "&".join(
        f"{urllib.parse.quote(k, safe='')}={urllib.parse.quote(v, safe='')}"
        for k, v in sorted(oauth_params.items())
    )
    base_string = "&".join([
        method.upper(),
        urllib.parse.quote(url, safe=""),
        urllib.parse.quote(encoded_params, safe=""),
    ])

    # Sign with HMAC-SHA1
    signing_key = f"{urllib.parse.quote(consumer_secret, safe='')}&"
    signature = base64.b64encode(
        hmac.new(
            signing_key.encode("utf-8"),
            base_string.encode("utf-8"),
            hashlib.sha1,
        ).digest()
    ).decode("utf-8")

    oauth_params["oauth_signature"] = signature

    # Build Authorization header
    auth_header = "OAuth " + ", ".join(
        f'{k}="{urllib.parse.quote(v, safe="")}"'
        for k, v in sorted(oauth_params.items())
    )

    return {
        "Authorization": auth_header,
        "Content-Type": "application/xml",
    }


def submit_grade(
    outcome_service_url: str,
    sourcedid: str,
    score: float,
    max_score: float,
    consumer_key: str,
    consumer_secret: str,
    timeout: int = 5,
) -> dict:
    """
    Submit a grade to the LMS via LTI Basic Outcomes.

    Args:
        outcome_service_url: The LMS outcome service endpoint
        sourcedid: The result sourcedid for this user/resource
        score: The achieved score
        max_score: The maximum possible score
        consumer_key: OAuth consumer key
        consumer_secret: OAuth consumer secret
        timeout: Request timeout in seconds

    Returns:
        dict with 'success', 'message', and optional 'error' fields
    """
    if not outcome_service_url or not sourcedid:
        return {"success": False, "error": "Missing outcome service URL or sourcedid"}

    # Normalize score to 0.0-1.0 range
    normalized_score = score / max_score if max_score > 0 else 0.0
    xml_body = _build_outcomes_xml(sourcedid, normalized_score)
    headers = _oauth_sign_request(
        outcome_service_url, "POST", xml_body,
        consumer_key, consumer_secret
    )

    try:
        response = requests.post(
            outcome_service_url,
            data=xml_body,
            headers=headers,
            timeout=timeout,
        )

        if response.status_code == 200 and "success" in response.text.lower():
            return {
                "success": True,
                "message": f"Grade {score}/{max_score} ({normalized_score:.0%}) submitted successfully",
            }
        else:
            return {
                "success": False,
                "error": f"LMS returned status {response.status_code}",
                "response_body": response.text[:500],
            }
    except requests.Timeout:
        return {"success": False, "error": "Timeout connecting to LMS outcome service"}
    except requests.RequestException as e:
        return {"success": False, "error": f"Request failed: {str(e)}"}
