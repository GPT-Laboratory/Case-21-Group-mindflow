from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    topic_name = Column(String, index=True, nullable=False)
    details = Column(Text, nullable=True)
    

    document = relationship("Document", backref="topics")
