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
from sqlalchemy.orm import Session

from models.lti_credential import LTICredential
from models.lti_nonce import LTINonce
from models.lti_session import LTISession


# ---------------------------------------------------------------------------
# OAuth Signature Verification
# ---------------------------------------------------------------------------

def _pct_encode(s: str) -> str:
    """RFC 5849 §3.6 percent-encoding (unreserved characters only)."""
    return urllib.parse.quote(str(s), safe='')


def _normalize_base_uri(uri: str) -> str:
    """Normalize the base string URI per RFC 5849 §3.4.1.2."""
    p = urllib.parse.urlparse(uri)
    scheme = p.scheme.lower()
    host = (p.hostname or "").lower()
    port = p.port
    if (scheme == "http" and port == 80) or (scheme == "https" and port == 443):
        port = None
    netloc = f"{host}:{port}" if port else host
    return f"{scheme}://{netloc}{p.path}"


def verify_lti_signature(
    uri: str,
    http_method: str,
    body: str,
    headers: dict,
    db: Session
) -> tuple[bool, Optional[str]]:
    """
    Verify an OAuth 1.0 HMAC-SHA1 signature on an LTI launch request.

    Uses a direct RFC 5849 implementation instead of oauthlib, which has
    known issues with signature verification in proxied environments
    (see also: educhat's ``SignatureOnlyEndpointCompromised`` workaround).

    ``body`` must be the raw application/x-www-form-urlencoded string exactly
    as received from the LMS.

    Returns (is_valid, error_message).
    """
    import base64

    # Parse raw body params
    params = urllib.parse.parse_qsl(body, keep_blank_values=True)
    params_dict = dict(params)

    received_sig = params_dict.get("oauth_signature")
    if not received_sig:
        return False, "Missing oauth_signature"

    consumer_key = params_dict.get("oauth_consumer_key", "")
    if not consumer_key:
        return False, "Missing oauth_consumer_key"

    sig_method = params_dict.get("oauth_signature_method", "")
    if sig_method != "HMAC-SHA1":
        return False, f"Unsupported signature method: {sig_method}"

    # Look up the consumer secret
    credential = db.query(LTICredential).filter(
        LTICredential.consumer_key == consumer_key
    ).first()
    if not credential:
        return False, "Unknown consumer key"

    # Validate timestamp
    timestamp = params_dict.get("oauth_timestamp", "")
    try:
        ts = int(timestamp)
    except (TypeError, ValueError):
        return False, "Invalid timestamp"

    max_age = int(os.getenv("LTI_MAX_TIMESTAMP_AGE_SECONDS", "300"))
    if abs(int(time.time()) - ts) > max_age:
        return False, f"Timestamp too old (delta > {max_age}s)"

    # Check nonce replay
    nonce = params_dict.get("oauth_nonce", "")
    if nonce:
        existing = db.query(LTINonce).filter(
            LTINonce.consumer_key == consumer_key,
            LTINonce.nonce == nonce,
        ).first()
        if existing:
            return False, "Nonce already used"
        db.add(LTINonce(consumer_key=consumer_key, nonce=nonce, oauth_timestamp=timestamp))
        db.commit()

    # Build signature base string per RFC 5849 §3.4.1
    base_uri = _normalize_base_uri(uri)
    params_no_sig = [(k, v) for k, v in params if k != "oauth_signature"]
    encoded_pairs = sorted((_pct_encode(k), _pct_encode(v)) for k, v in params_no_sig)
    norm_params = "&".join(f"{k}={v}" for k, v in encoded_pairs)
    base_string = f"{http_method.upper()}&{_pct_encode(base_uri)}&{_pct_encode(norm_params)}"

    # HMAC-SHA1
    signing_key = f"{_pct_encode(credential.consumer_secret)}&"
    expected_sig = base64.b64encode(
        hmac.new(signing_key.encode(), base_string.encode(), hashlib.sha1).digest()
    ).decode()

    if not hmac.compare_digest(expected_sig, received_sig):
        return False, "Invalid OAuth signature"

    return True, None


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
