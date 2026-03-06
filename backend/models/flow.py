from sqlalchemy import Column, String, Integer, DateTime, JSON
from database import Base
import datetime

class Flow(Base):
    __tablename__ = "flows"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    last_modified = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    node_count = Column(Integer, default=0)
    edge_count = Column(Integer, default=0)
    flow_type = Column(String, default="saved")
    nodes = Column(JSON, nullable=False)
    edges = Column(JSON, nullable=False)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
