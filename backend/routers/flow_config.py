"""
Flow configuration/settings routes.
Provides per-flow settings management:
  - GET    /api/flows/{id}/config         — Get flow settings
  - PATCH  /api/flows/{id}/config         — Update flow settings
  - GET    /api/flows/{id}/collaborators       — List collaborators
  - POST   /api/flows/{id}/collaborators       — Add collaborator
  - DELETE /api/flows/{id}/collaborators/{uid} — Remove collaborator
  - POST   /api/flows/{id}/config/regenerate-key — Regenerate access key
"""
import secrets
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.flow import Flow, FlowCollaborator
from services.auth_service import CurrentUser, require_instructor

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class FlowConfigResponse(BaseModel):
    flow_id: str
    name: str
    description: Optional[str] = None
    is_published: bool
    access_key_required: bool
    access_key: Optional[str] = None
    owner_id: Optional[str] = None
    ollama_model: Optional[str] = None
    lti_exercise_url: Optional[str] = None
    collaborators: List[dict] = []


class FlowConfigUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_published: Optional[bool] = None
    access_key_required: Optional[bool] = None
    access_key: Optional[str] = None
    ollama_model: Optional[str] = None


class CollaboratorAdd(BaseModel):
    user_id: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_flow_or_404(flow_id: str, db: Session) -> Flow:
    flow = db.query(Flow).filter(Flow.id == flow_id).first()
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    return flow


def _get_collaborators(flow_id: str, db: Session) -> list[dict]:
    collabs = db.query(FlowCollaborator).filter(
        FlowCollaborator.flow_id == flow_id
    ).all()
    return [
        {
            "user_id": c.user_id,
            "added_by": c.added_by,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in collabs
    ]


def _build_lti_url(flow: Flow) -> str:
    """Build the LTI exercise launch URL for this flow."""
    return f"/api/lti/exercise/{flow.id}"


def _generate_access_key() -> str:
    """Generate a random 8-char uppercase access key."""
    return secrets.token_hex(4).upper()


def _require_flow_owner(flow: Flow, user: CurrentUser, db: Session):
    """Raise 403 if user is not owner or collaborator of the flow."""
    if flow.owner_id == user.user_id:
        return
    collab = db.query(FlowCollaborator).filter(
        FlowCollaborator.flow_id == flow.id,
        FlowCollaborator.user_id == user.user_id,
    ).first()
    if not collab:
        raise HTTPException(status_code=403, detail="Only the owner or collaborators can modify this flow")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/{flow_id}/config")
def get_flow_config(
    flow_id: str,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(require_instructor),
):
    """Get flow configuration/settings."""
    flow = _get_flow_or_404(flow_id, db)
    _require_flow_owner(flow, user, db)
    collaborators = _get_collaborators(flow_id, db)

    return FlowConfigResponse(
        flow_id=flow.id,
        name=flow.name,
        description=flow.description,
        is_published=flow.is_published or False,
        access_key_required=flow.access_key_required or False,
        access_key=flow.access_key,
        owner_id=flow.owner_id,
        ollama_model=flow.ollama_model,
        lti_exercise_url=_build_lti_url(flow),
        collaborators=collaborators,
    )


@router.patch("/{flow_id}/config")
def update_flow_config(
    flow_id: str,
    updates: FlowConfigUpdate,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(require_instructor),
):
    """Update flow configuration/settings (partial update)."""
    flow = _get_flow_or_404(flow_id, db)
    _require_flow_owner(flow, user, db)

    if updates.name is not None:
        flow.name = updates.name
    if updates.description is not None:
        flow.description = updates.description
    if updates.is_published is not None:
        flow.is_published = updates.is_published
    if updates.access_key_required is not None:
        flow.access_key_required = updates.access_key_required
        if not updates.access_key_required:
            flow.access_key = None
    if updates.access_key is not None:
        flow.access_key = updates.access_key
    if updates.ollama_model is not None:
        flow.ollama_model = updates.ollama_model

    db.commit()
    db.refresh(flow)

    collaborators = _get_collaborators(flow_id, db)
    return FlowConfigResponse(
        flow_id=flow.id,
        name=flow.name,
        description=flow.description,
        is_published=flow.is_published or False,
        access_key_required=flow.access_key_required or False,
        access_key=flow.access_key,
        owner_id=flow.owner_id,
        ollama_model=flow.ollama_model,
        lti_exercise_url=_build_lti_url(flow),
        collaborators=collaborators,
    )


@router.post("/{flow_id}/config/regenerate-key")
def regenerate_access_key(
    flow_id: str,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(require_instructor),
):
    """Generate a new access key for the flow."""
    flow = _get_flow_or_404(flow_id, db)
    _require_flow_owner(flow, user, db)
    flow.access_key = _generate_access_key()
    flow.access_key_required = True
    db.commit()
    db.refresh(flow)
    return {"access_key": flow.access_key}


# ---------------------------------------------------------------------------
# Collaborators
# ---------------------------------------------------------------------------

@router.get("/{flow_id}/collaborators")
def list_collaborators(
    flow_id: str,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(require_instructor),
):
    """List collaborators for a flow."""
    flow = _get_flow_or_404(flow_id, db)
    _require_flow_owner(flow, user, db)
    return {"collaborators": _get_collaborators(flow_id, db)}


@router.post("/{flow_id}/collaborators")
def add_collaborator(
    flow_id: str,
    data: CollaboratorAdd,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(require_instructor),
):
    """Add a collaborator to a flow."""
    flow = _get_flow_or_404(flow_id, db)
    _require_flow_owner(flow, user, db)

    # Check if already a collaborator
    existing = db.query(FlowCollaborator).filter(
        FlowCollaborator.flow_id == flow_id,
        FlowCollaborator.user_id == data.user_id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="User is already a collaborator")

    collab = FlowCollaborator(
        flow_id=flow_id,
        user_id=data.user_id,
        added_by=flow.owner_id,
    )
    db.add(collab)
    db.commit()

    return {"collaborators": _get_collaborators(flow_id, db)}


@router.delete("/{flow_id}/collaborators/{user_id}")
def remove_collaborator(
    flow_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(require_instructor),
):
    """Remove a collaborator from a flow."""
    flow = _get_flow_or_404(flow_id, db)
    _require_flow_owner(flow, user, db)

    collab = db.query(FlowCollaborator).filter(
        FlowCollaborator.flow_id == flow_id,
        FlowCollaborator.user_id == user_id,
    ).first()
    if not collab:
        raise HTTPException(status_code=404, detail="Collaborator not found")

    db.delete(collab)
    db.commit()
    return {"collaborators": _get_collaborators(flow_id, db)}
