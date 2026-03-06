from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
import datetime
from database import get_db
from models.flow import Flow
from schemas import FlowCreate, FlowResponse, ApiResponse

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
        createdAt=db_flow.created_at
    )

@router.get("/", response_model=ApiResponse[List[FlowResponse]])
def get_flows(db: Session = Depends(get_db)):
    db_flows = db.query(Flow).order_by(Flow.last_modified.desc()).all()
    flows = [map_db_flow_to_response(f) for f in db_flows]
    return ApiResponse(success=True, data=flows, message="Flows fetched successfully")

@router.post("/", response_model=ApiResponse[FlowResponse])
def create_flow(flow: FlowCreate, db: Session = Depends(get_db)):
    db_flow = Flow(
        id=str(uuid.uuid4()),
        name=flow.name,
        description=flow.description,
        node_count=flow.nodeCount,
        edge_count=flow.edgeCount,
        flow_type=flow.type,
        nodes=flow.nodes,
        edges=flow.edges,
        metadata_json=flow.metadata
    )
    db.add(db_flow)
    db.commit()
    db.refresh(db_flow)
    return ApiResponse(success=True, data=map_db_flow_to_response(db_flow), message="Flow created successfully")

@router.get("/{flow_id}", response_model=ApiResponse[FlowResponse])
def get_flow(flow_id: str, db: Session = Depends(get_db)):
    db_flow = db.query(Flow).filter(Flow.id == flow_id).first()
    if not db_flow:
        return ApiResponse(success=False, error="Flow not found", message="Flow not found")
    return ApiResponse(success=True, data=map_db_flow_to_response(db_flow), message="Flow fetched successfully")

@router.put("/{flow_id}", response_model=ApiResponse[FlowResponse])
def update_flow(flow_id: str, flow: FlowCreate, db: Session = Depends(get_db)):
    db_flow = db.query(Flow).filter(Flow.id == flow_id).first()
    if not db_flow:
        return ApiResponse(success=False, error="Flow not found", message="Flow not found")
    
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
def delete_flow(flow_id: str, db: Session = Depends(get_db)):
    db_flow = db.query(Flow).filter(Flow.id == flow_id).first()
    if not db_flow:
        return ApiResponse(success=False, error="Flow not found", message="Flow not found")
    
    db.delete(db_flow)
    db.commit()
    return ApiResponse(success=True, data=True, message="Flow deleted successfully")
