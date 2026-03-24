from sqlalchemy import Column, Integer, String, Boolean, JSON
from database import Base

class EvaluationResult(Base):
    __tablename__ = "evaluation_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=True) # Optional, depends on auth implementation
    flow_data = Column(JSON, nullable=False)
    status = Column(String, default="pending", nullable=False)
    is_valid = Column(Boolean, nullable=True)
    feedback = Column(String, nullable=True)
    points = Column(Integer, nullable=True)
    
    document_id = Column(Integer, index=True, nullable=True)
