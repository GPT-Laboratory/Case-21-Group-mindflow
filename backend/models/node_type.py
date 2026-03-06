from sqlalchemy import Column, String, DateTime, JSON
from database import Base
import datetime

class NodeType(Base):
    __tablename__ = "node_types"

    node_type = Column(String, primary_key=True, index=True)
    default_label = Column(String, nullable=False)
    category = Column(String, nullable=False)
    group_type = Column(String, nullable=False)
    description = Column(String, nullable=True)
    visual = Column(JSON, nullable=False)
    handles = Column(JSON, nullable=False)
    process = Column(JSON, nullable=False)
    default_dimensions = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
