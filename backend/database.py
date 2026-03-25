from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "postgres")

SQLALCHEMY_DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Avoid circular imports by importing models here just for table creation
from models.document import Document
from models.flow import Flow, FlowCollaborator
from models.node_type import NodeType
from models.topic import Topic
from models.evaluation import EvaluationResult
from models.lti_credential import LTICredential
from models.lti_session import LTISession
from models.lti_nonce import LTINonce
from models.auth_user import AuthUser

Base.metadata.create_all(bind=engine)

# Lightweight schema sync for older local DBs where these columns may not exist.
with engine.begin() as conn:
    conn.execute(text("ALTER TABLE lti_credentials ADD COLUMN IF NOT EXISTS user_id VARCHAR"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS idx_lti_credentials_user_id ON lti_credentials(user_id)"))
    conn.execute(
        text(
            "ALTER TABLE evaluation_results ADD COLUMN IF NOT EXISTS document_id INTEGER"
        )
    )
    conn.execute(
        text(
            "CREATE INDEX IF NOT EXISTS ix_evaluation_results_document_id ON evaluation_results(document_id)"
        )
    )
    conn.execute(
        text("ALTER TABLE flows ADD COLUMN IF NOT EXISTS ollama_model VARCHAR")
    )
