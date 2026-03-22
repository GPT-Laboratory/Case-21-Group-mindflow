import uuid
from sqlalchemy import Column, String, DateTime, JSON, func
from database import Base


class LTISession(Base):
    __tablename__ = "lti_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_token = Column(String, unique=True, nullable=False, index=True)
    user_id = Column(String, nullable=True)
    user_email = Column(String, nullable=True)
    user_name = Column(String, nullable=True)
    roles = Column(String, nullable=True)
    context_id = Column(String, nullable=True)
    context_title = Column(String, nullable=True)
    resource_link_id = Column(String, nullable=True)
    exercise_id = Column(String, nullable=True)
    # Outcome service fields for grade passback
    outcome_service_url = Column(String, nullable=True)
    result_sourcedid = Column(String, nullable=True)
    consumer_key = Column(String, nullable=True)
    consumer_secret = Column(String, nullable=True)
    # Raw LTI data for reference
    lti_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
