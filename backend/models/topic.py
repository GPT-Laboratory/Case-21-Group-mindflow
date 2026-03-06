from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    topic_name = Column(String, index=True, nullable=False)
    details = Column(Text, nullable=True)
    
    course_id = Column(String, index=True, nullable=True)
    module_id = Column(String, index=True, nullable=True)
    exercise_id = Column(String, index=True, nullable=True)

    document = relationship("Document", backref="topics")
