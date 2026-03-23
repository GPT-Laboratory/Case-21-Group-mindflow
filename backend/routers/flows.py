from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
import uuid
import datetime
from database import get_db
from models.flow import Flow, FlowCollaborator
from schemas import FlowCreate, FlowResponse, ApiResponse
from services.auth_service import (
    CurrentUser,
    get_current_user,
    require_current_user,
    require_instructor,
)

router = APIRouter()

def map_db_flow_to_response(db_flow: Flow) -> FlowResponse:
    return FlowResponse(
        id=db_flow.id,
        name=db_flow.name,
        description=db_flow.description,
        nodeCount=db_flow.node_count,
        edgeCount=db_flow.edge_count,
        type=db_flow.flow_type,
        nodes=db_flow.nodes,
        edges=db_flow.edges,
        metadata=db_flow.metadata_json,
        lastModified=db_flow.last_modified,
        createdAt=db_flow.created_at,
        owner_id=db_flow.owner_id,
        is_published=db_flow.is_published or False,
    )


def _is_owner_or_collaborator(flow: Flow, user: CurrentUser, db: Session) -> bool:
    if flow.owner_id == user.user_id:
        return True
    collab = db.query(FlowCollaborator).filter(
        FlowCollaborator.flow_id == flow.id,
        FlowCollaborator.user_id == user.user_id,
    ).first()
    return collab is not None


@router.get("/", response_model=ApiResponse[List[FlowResponse]])
def get_flows(
    db: Session = Depends(get_db),
    user: Optional[CurrentUser] = Depends(get_current_user),
):
    """
    List flows filtered by role:
    - Instructors: own flows + collaborator flows + all published flows
    - Students: published flows only
    - Unauthenticated: published flows only
    """
    if user and user.role == "instructor":
        # Own + collaborator + published
        collab_flow_ids = [
            c.flow_id for c in db.query(FlowCollaborator.flow_id).filter(
                FlowCollaborator.user_id == user.user_id
            ).all()
        ]
        db_flows = db.query(Flow).filter(
            or_(
                Flow.owner_id == user.user_id,
                Flow.id.in_(collab_flow_ids) if collab_flow_ids else False,
                Flow.is_published == True,
            )
        ).order_by(Flow.last_modified.desc()).all()
    else:
        # Students and unauthenticated: published only
        db_flows = db.query(Flow).filter(
            Flow.is_published == True
        ).order_by(Flow.last_modified.desc()).all()

    flows = [map_db_flow_to_response(f) for f in db_flows]
    return ApiResponse(success=True, data=flows, message="Flows fetched successfully")


@router.post("/", response_model=ApiResponse[FlowResponse])
def create_flow(
    flow: FlowCreate,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(require_instructor),
):
    db_flow = Flow(
        id=str(uuid.uuid4()),
        name=flow.name,
        description=flow.description,
        node_count=flow.nodeCount,
        edge_count=flow.edgeCount,
        flow_type=flow.type,
        nodes=flow.nodes,
        edges=flow.edges,
        metadata_json=flow.metadata,
        owner_id=user.user_id,
    )
    db.add(db_flow)
    db.commit()
    db.refresh(db_flow)
    return ApiResponse(success=True, data=map_db_flow_to_response(db_flow), message="Flow created successfully")


@router.get("/{flow_id}", response_model=ApiResponse[FlowResponse])
def get_flow(
    flow_id: str,
    db: Session = Depends(get_db),
    user: Optional[CurrentUser] = Depends(get_current_user),
):
    db_flow = db.query(Flow).filter(Flow.id == flow_id).first()
    if not db_flow:
        return ApiResponse(success=False, error="Flow not found", message="Flow not found")

    # Published flows are visible to anyone
    if not db_flow.is_published:
        if not user:
            raise HTTPException(status_code=401, detail="Authentication required")
        if not _is_owner_or_collaborator(db_flow, user, db):
            raise HTTPException(status_code=403, detail="Access denied")

    return ApiResponse(success=True, data=map_db_flow_to_response(db_flow), message="Flow fetched successfully")


@router.put("/{flow_id}", response_model=ApiResponse[FlowResponse])
def update_flow(
    flow_id: str,
    flow: FlowCreate,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(require_current_user),
):
    db_flow = db.query(Flow).filter(Flow.id == flow_id).first()
    if not db_flow:
        return ApiResponse(success=False, error="Flow not found", message="Flow not found")

    # Only owner/collaborators can update
    if not _is_owner_or_collaborator(db_flow, user, db):
        raise HTTPException(status_code=403, detail="Only the owner or collaborators can edit this flow")

    db_flow.name = flow.name
    db_flow.description = flow.description
    db_flow.node_count = flow.nodeCount
    db_flow.edge_count = flow.edgeCount
    db_flow.flow_type = flow.type
    db_flow.nodes = flow.nodes
    db_flow.edges = flow.edges
    db_flow.metadata_json = flow.metadata
    db_flow.last_modified = datetime.datetime.utcnow()

    db.commit()
    db.refresh(db_flow)
    return ApiResponse(success=True, data=map_db_flow_to_response(db_flow), message="Flow updated successfully")


@router.delete("/{flow_id}", response_model=ApiResponse[bool])
def delete_flow(
    flow_id: str,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(require_current_user),
):
    db_flow = db.query(Flow).filter(Flow.id == flow_id).first()
    if not db_flow:
        return ApiResponse(success=False, error="Flow not found", message="Flow not found")

    # Only the owner can delete
    if db_flow.owner_id and db_flow.owner_id != user.user_id:
        raise HTTPException(status_code=403, detail="Only the owner can delete this flow")

    db.delete(db_flow)
    db.commit()
    return ApiResponse(success=True, data=True, message="Flow deleted successfully")
