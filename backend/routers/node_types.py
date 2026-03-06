from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.node_type import NodeType
from schemas import NodeTypeCreate, NodeTypeResponse, ApiResponse

router = APIRouter()

def map_db_node_type_to_response(db_node_type: NodeType) -> NodeTypeResponse:
    return NodeTypeResponse(
        nodeType=db_node_type.node_type,
        defaultLabel=db_node_type.default_label,
        category=db_node_type.category,
        group=db_node_type.group_type,
        description=db_node_type.description,
        visual=db_node_type.visual,
        handles=db_node_type.handles,
        process=db_node_type.process,
        defaultDimensions=db_node_type.default_dimensions,
        createdAt=db_node_type.created_at,
        updatedAt=db_node_type.updated_at
    )

@router.get("/", response_model=ApiResponse[List[NodeTypeResponse]])
def get_node_types(db: Session = Depends(get_db)):
    db_node_types = db.query(NodeType).order_by(NodeType.node_type).all()
    node_types = [map_db_node_type_to_response(n) for n in db_node_types]
    return ApiResponse(success=True, data=node_types, message="Node types fetched successfully")

@router.post("/", response_model=ApiResponse[NodeTypeResponse])
def create_node_type(node_type: NodeTypeCreate, db: Session = Depends(get_db)):
    db_node_type = NodeType(
        node_type=node_type.nodeType,
        default_label=node_type.defaultLabel,
        category=node_type.category,
        group_type=node_type.group,
        description=node_type.description,
        visual=node_type.visual,
        handles=node_type.handles,
        process=node_type.process,
        default_dimensions=node_type.defaultDimensions
    )
    db.add(db_node_type)
    db.commit()
    db.refresh(db_node_type)
    return ApiResponse(success=True, data=map_db_node_type_to_response(db_node_type), message="Node type created successfully")

@router.get("/{node_type}", response_model=ApiResponse[NodeTypeResponse])
def get_node_type(node_type: str, db: Session = Depends(get_db)):
    db_node_type = db.query(NodeType).filter(NodeType.node_type == node_type).first()
    if not db_node_type:
        return ApiResponse(success=False, error="Node type not found", message="Node type not found")
    return ApiResponse(success=True, data=map_db_node_type_to_response(db_node_type), message="Node type fetched successfully")

@router.put("/{node_type}", response_model=ApiResponse[NodeTypeResponse])
def update_node_type(node_type: str, node_type_data: NodeTypeCreate, db: Session = Depends(get_db)):
    db_node_type = db.query(NodeType).filter(NodeType.node_type == node_type).first()
    if not db_node_type:
        return ApiResponse(success=False, error="Node type not found", message="Node type not found")
    
    db_node_type.default_label = node_type_data.defaultLabel
    db_node_type.category = node_type_data.category
    db_node_type.group_type = node_type_data.group
    db_node_type.description = node_type_data.description
    db_node_type.visual = node_type_data.visual
    db_node_type.handles = node_type_data.handles
    db_node_type.process = node_type_data.process
    db_node_type.default_dimensions = node_type_data.defaultDimensions
    
    db.commit()
    db.refresh(db_node_type)
    return ApiResponse(success=True, data=map_db_node_type_to_response(db_node_type), message="Node type updated successfully")

@router.delete("/{node_type}", response_model=ApiResponse[bool])
def delete_node_type(node_type: str, db: Session = Depends(get_db)):
    db_node_type = db.query(NodeType).filter(NodeType.node_type == node_type).first()
    if not db_node_type:
        return ApiResponse(success=False, error="Node type not found", message="Node type not found")
    
    db.delete(db_node_type)
    db.commit()
    return ApiResponse(success=True, data=True, message="Node type deleted successfully")
