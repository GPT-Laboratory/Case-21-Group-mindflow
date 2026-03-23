import uuid
from sqlalchemy import Column, String, DateTime, func
from database import Base


class LTINonce(Base):
    __tablename__ = "lti_nonces"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    consumer_key = Column(String, nullable=False, index=True)
    nonce = Column(String, nullable=False, index=True)
    oauth_timestamp = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
