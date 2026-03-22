from sqlalchemy import Column, String, Integer, DateTime, JSON, Boolean, ForeignKey
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

    # Settings fields (adapted from css-artist game settings)
    owner_id = Column(String, nullable=True)
    is_published = Column(Boolean, default=False)
    access_key_required = Column(Boolean, default=False)
    access_key = Column(String, nullable=True)
    course_id = Column(String, nullable=True, index=True)
    module_id = Column(String, nullable=True, index=True)
    exercise_id = Column(String, nullable=True, index=True)


class FlowCollaborator(Base):
    __tablename__ = "flow_collaborators"

    id = Column(Integer, primary_key=True, autoincrement=True)
    flow_id = Column(String, ForeignKey("flows.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, nullable=False)
    added_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
