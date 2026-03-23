import uuid
import secrets
from sqlalchemy import Column, String, DateTime, func
from database import Base


class LTICredential(Base):
    __tablename__ = "lti_credentials"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=True, unique=True, index=True)
    consumer_key = Column(String, unique=True, nullable=False, index=True)
    consumer_secret = Column(String, nullable=False)
    description = Column(String, nullable=True, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    @staticmethod
    def generate_key():
        return str(uuid.uuid4())

    @staticmethod
    def generate_secret():
        return secrets.token_hex(32)
