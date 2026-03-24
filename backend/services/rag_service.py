import os
import torch
import logging
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_postgres import PGVector
from langchain_core.documents import Document as LC_Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from database import SQLALCHEMY_DATABASE_URL
from sqlalchemy.orm import Session
from models.document import Document as DB_Document
import psycopg2

logger = logging.getLogger(__name__)

# Use HuggingFace sentence-transformers and torch for local embeddings
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
device = 'cuda' if torch.cuda.is_available() else 'cpu'
embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL, model_kwargs={'device': device})

def get_vector_with_embedding(collection_name):
    """
    Initialize PGVector with the specified collection name.
    """
    try:
        return PGVector(
            connection=SQLALCHEMY_DATABASE_URL,
            collection_name=collection_name,
            embeddings=embeddings,
            use_jsonb=True
        )
    except Exception as ex:
        logger.error(f"Error in vector embedding: {ex}")
        raise

from services.llm_service import extract_topics_from_text
from services.topic_utils import deduplicate_topics, embeddings
import requests
import json
import logging
from sqlalchemy.orm import Session
from models.topic import Topic
import numpy as np



def save_topics_to_db(topics: list[dict], doc_id: int, db: Session):
    """Saves the extracted topics and their details to the database."""
    if not db:
        return
        
    for topic_data in topics:
        topic_name = topic_data.get("topic")
        details = topic_data.get("details")
        
        topic = Topic(
            document_id=doc_id,
            topic_name=topic_name,
            details=details
        )
        db.add(topic)
    try:
        db.commit()
    except Exception as e:
        logger.error(f"Error saving topics to DB: {e}")
        db.rollback()

def process_file_and_embed(file_path: str, filename: str, doc_id: int, db: Session):
    """
    Extracts text, splits it, embeds into PGVector, extracts and saves topics.
    """
    if filename.endswith('.pdf'):
        loader = PyPDFLoader(file_path)
    else:
        loader = TextLoader(file_path, autodetect_encoding=True)
    
    documents = loader.load()
    
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = text_splitter.split_documents(documents)
    
    all_topics = []
    
    # Add metadata
    for split in splits:
        split.metadata['filename'] = filename
        split.metadata['document_id'] = doc_id
        
        # Extract topics for this chunk
        chunk_topics = extract_topics_from_text(split.page_content)
        all_topics.extend(chunk_topics)

    # Deduplicate topics conceptually (based on topic name)
    print("All topics collected: ", all_topics)
    # Simple deduplication by topic name for now, keeping the first occurrence's details
    unique_topics_dict = {}
    for t in all_topics:
        name = t.get("topic")
        if name not in unique_topics_dict:
            unique_topics_dict[name] = t
    
    unique_topics = list(unique_topics_dict.values())
    print("Unique topics: ", unique_topics)
    logger.info(f"Extracted unique topics for {filename}: {unique_topics}")
    
    # Save topics to DB if provided
    if db and doc_id:
        save_topics_to_db(unique_topics, doc_id, db)

    collection_name = f"doc_{doc_id}_embeddings"
    vectorstore = get_vector_with_embedding(collection_name)
    vectorstore.add_documents(documents=splits)
    
    return True

def fetch_related_files(user_question, document_id: int, top_k=5, db: Session = None):
    """
    Retrieve top-k relevant documents from PGVector based on user query and document_id.
    """
    if not user_question:
        raise ValueError("User question cannot be empty")

    docs = []
    try:
        collection_name = f"doc_{document_id}_embeddings"

        try:
            vectordb = get_vector_with_embedding(collection_name)
            # similarity_search returns LC_Document objects
            results = vectordb.similarity_search(user_question, k=top_k)
            docs.extend(results)
        except Exception as e:
            logger.error(f"Failed fetching from collection {collection_name}: {e}", exc_info=True)

        return docs

    except Exception as e:
        logger.error(f"Error fetching related files: {e}", exc_info=True)
        raise

def delete_related_files(filename: str, document_id: int):
    """
    Delete all stored embeddings for a given document using raw SQL.
    """
    try:
        # LangChain usually wants postgresql+psycopg2 but the base URL is often just postgresql
        conn_str = SQLALCHEMY_DATABASE_URL
        
        with psycopg2.connect(conn_str) as conn:
            with conn.cursor() as cursor:
                query = """
                DELETE FROM langchain_pg_embedding
                WHERE cmetadata->>'filename' = %s
                  AND cmetadata->>'document_id' = %s
                """
                params = [filename, str(document_id)]
                cursor.execute(query, params)
                conn.commit()
        return True
    except Exception as e:
        logger.error(f"Error in deleting PgVector files: {e}")
        return False
