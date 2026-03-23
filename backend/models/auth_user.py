import uuid
from sqlalchemy import Column, String, DateTime, func
from database import Base


class AuthUser(Base):
    __tablename__ = "auth_users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, nullable=False, unique=True, index=True)
    name = Column(String, nullable=True)
    google_sub = Column(String, nullable=False, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
