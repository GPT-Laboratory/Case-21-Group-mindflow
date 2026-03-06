import logging
import numpy as np
from langchain_huggingface import HuggingFaceEmbeddings
import torch

logger = logging.getLogger(__name__)

# Use HuggingFace sentence-transformers and torch for local embeddings
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
device = 'cuda' if torch.cuda.is_available() else 'cpu'
embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL, model_kwargs={'device': device})

def deduplicate_topics(topics: list[str], threshold=0.85) -> list[str]:
    """Deduplicates topics using conceptual similarity."""
    if not topics:
        return []
        
    unique_topics = []
    
    # Get embeddings for all topics
    try:
        topic_embeddings = embeddings.embed_documents(topics)
        
        for i, (topic, emb) in enumerate(zip(topics, topic_embeddings)):
            is_duplicate = False
            for u_topic in unique_topics:
                u_emb = embeddings.embed_query(u_topic)
                # Compute cosine similarity
                similarity = np.dot(emb, u_emb) / (np.linalg.norm(emb) * np.linalg.norm(u_emb))
                if similarity > threshold:
                    is_duplicate = True
                    break
            if not is_duplicate:
                unique_topics.append(topic)
                
    except Exception as e:
        logger.error(f"Failed to deduplicate topics, falling back to exact match: {e}")
        return list(set(topics)) # fallback to exact string matching

    return unique_topics

def find_matching_missing_topics(db_topics: list[str], flow_topics: list[str], threshold=0.85) -> tuple[list[str], list[str]]:
    """
    Given a list of topics from the database and a list from the user's flow,
    uses conceptual similarity to find which database topics match those in the flow
    and which are missing.
    Returns (matching_topics, missing_topics).
    """
    matching_topics = []
    missing_topics = []
    
    if flow_topics and db_topics:
        try:
            db_embeddings = embeddings.embed_documents(db_topics)
            flow_embeddings = embeddings.embed_documents(flow_topics)
            
            for d_idx, (d_topic, d_emb) in enumerate(zip(db_topics, db_embeddings)):
                is_match = False
                for f_idx, (f_topic, f_emb) in enumerate(zip(flow_topics, flow_embeddings)):
                    sim = np.dot(d_emb, f_emb) / (np.linalg.norm(d_emb) * np.linalg.norm(f_emb))
                    if sim > threshold:
                        is_match = True
                        break
                if is_match:
                    matching_topics.append(d_topic)
                else:
                    missing_topics.append(d_topic)
        except Exception as e:
            logger.error(f"Error computing topic similarity: {e}")
            matching_topics = flow_topics
            missing_topics = [t for t in db_topics if t not in flow_topics]
    else:
        matching_topics = flow_topics
        missing_topics = db_topics
        
    return matching_topics, missing_topics
