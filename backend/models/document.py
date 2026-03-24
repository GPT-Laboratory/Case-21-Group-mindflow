from sqlalchemy import Column, Integer, String, DateTime
from database import Base
import datetime

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    doc_path = Column(String, nullable=True)
    processing_status = Column(String, default="processing")
    created_by = Column(String, default="system")
    created_dt = Column(DateTime, default=datetime.datetime.utcnow)
