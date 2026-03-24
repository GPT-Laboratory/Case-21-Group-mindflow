from pydantic import BaseModel
from typing import Optional, List, Any, Generic, TypeVar
from datetime import datetime

T = TypeVar('T')

class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    message: str = ""
    error: Optional[str] = None

class DocumentResponse(BaseModel):
    id: int
    filename: str
    doc_path: Optional[str]
    processing_status: str
    processing_status: str
    created_by: str
    created_dt: datetime

    class Config:
        from_attributes = True

class ValidateRequest(BaseModel):
    flow_data: dict
    document_id: int

# Ported Flow schemas
class FlowBase(BaseModel):
    name: str
    description: Optional[str] = ""
    nodeCount: Optional[int] = 0
    edgeCount: Optional[int] = 0
    type: Optional[str] = "saved"
    nodes: List[Any]
    edges: List[Any]
    metadata: Optional[dict] = {}

class FlowCreate(FlowBase):
    pass

class FlowResponse(FlowBase):
    id: str
    lastModified: datetime
    createdAt: datetime
    owner_id: Optional[str] = None
    is_published: bool = False

    class Config:
        from_attributes = True

# Ported Node Type schemas
class NodeTypeBase(BaseModel):
    nodeType: str
    defaultLabel: str
    category: str
    group: str
    description: Optional[str] = ""
    visual: dict
    handles: dict
    process: dict
    defaultDimensions: Optional[dict] = None

class NodeTypeCreate(NodeTypeBase):
    pass

class NodeTypeResponse(NodeTypeBase):
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True
