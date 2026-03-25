import os
import requests
import json
import time
import logging
import numpy as np
from typing import Optional, Any
from sqlalchemy.orm import Session
from models.topic import Topic
from services.topic_utils import find_matching_missing_topics
from services.prompts import get_extract_topics_prompt, get_validation_prompt

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
VALIDATION_MODEL = os.getenv("VALIDATION_MODEL", "llama3.2")
VALID_THRESHOLD = float(os.getenv("VALID_THRESHOLD", "0.6"))  # pass/fail threshold

def call_llm(prompt: str, format: str = "json", max_retries: int = 2, timeout: int = 120) -> Any:
    """
    Generic function to call local Ollama API with retry logic.
    Returns the parsed JSON response or raw text.
    """
    payload = {
        "model": VALIDATION_MODEL,
        "prompt": prompt,
        "stream": False,
    }
    print("Call_llm payload: ", payload)
    if format == "json":
        payload["format"] = "json"

    retry_delay = 5
    for attempt in range(max_retries):
        try:
            response = requests.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json=payload,
                timeout=timeout
            )
            response.raise_for_status()
            result_json = response.json()
            response_text = result_json.get("response", "")
            print("Call_llm response text: ", response_text)
            
            return response_text

        except requests.exceptions.Timeout:
            if attempt < max_retries - 1:
                logger.warning(f"Ollama timeout on attempt {attempt + 1}, retrying in {retry_delay}s...")
                time.sleep(retry_delay)
                retry_delay *= 2
            else:
                logger.error(f"Ollama API timed out after {max_retries} attempts.")
                return None
        except Exception as e:
            logger.error(f"Error calling Ollama API: {e}")
            return None
    return None

import re

def extract_topics_from_text(text: str) -> list[dict]:
    """Uses Ollama to extract core concepts and details via regex parsing."""
    prompt = get_extract_topics_prompt(text)
    # Using format=None to get raw text instead of forcing JSON
    response_text = call_llm(prompt, format=None, timeout=60)
    
    if not response_text:
        return []

    print("Topic extraction raw response: ", response_text)

    # Regex to match Topic: ... and Details: [...]
    # Topic: (.*) - matches the topic name
    # Details: \[(.*)\] - matches the content inside brackets
    pattern = r"Topic:\s*(.*?)\s*\nDetails:\s*\[(.*?)\]"
    matches = re.finditer(pattern, response_text, re.IGNORECASE | re.DOTALL)
    
    extracted = []
    for match in matches:
        topic_name = match.group(1).strip()
        details_str = match.group(2).strip()
        # Clean up the details list
        details = [d.strip().strip('"').strip("'") for d in details_str.split(',') if d.strip()]
        extracted.append({
            "topic": topic_name,
            "details": json.dumps(details) # Store as JSON string in DB
        })
    
    print("Extracted topics with regex: ", extracted)
    return extracted

def _extract_flow_topics_with_details(flow_data: dict) -> list[dict]:
    """
    Extract topic names and details from flow nodes using regex/pattern matching.
    Each node's 'label' becomes the topic name; 'description' or 'details' becomes details.
    """
    extracted = []
    node_pattern = re.compile(r'^[\w\s]+$')  # basic sanity check for label

    for node in flow_data.get("nodes", []):
        data = node.get("data", {})
        label = data.get("label", "").strip()
        if not label:
            continue

        # Try to pick up details from known node data fields
        raw_details = data.get("description") or data.get("details") or data.get("content") or ""
        if isinstance(raw_details, list):
            details = [str(d).strip() for d in raw_details if str(d).strip()]
        elif isinstance(raw_details, str) and raw_details.strip():
            # Split on commas or semicolons
            details = [d.strip() for d in re.split(r'[,;]', raw_details) if d.strip()]
        else:
            details = []

        extracted.append({"topic": label, "details": details})

    return extracted


def validate_flow_with_rag(flow_data: dict, document_id: int, db: Session = None):
    """
    RAG lookup for context then validate flow using LLM.
    Extracts topics+details from both user flow and DB, then passes rich context to LLM.
    Scoring: missing main topic → larger penalty; missing detail → smaller penalty.
    """
    # 1. Extract topics+details from flow using helper (regex-based detail extraction)
    flow_topic_dicts = _extract_flow_topics_with_details(flow_data)
    flow_topic_names = [t["topic"] for t in flow_topic_dicts]

    # 2. Fetch topics+details from DB
    db_topic_dicts = []
    if db:
        query = db.query(Topic).filter(Topic.document_id == document_id)
        db_rows = query.all()
        seen = set()
        for t in db_rows:
            if t.topic_name and t.topic_name not in seen:
                seen.add(t.topic_name)
                # Parse stored JSON details string back to list
                details = []
                if t.details:
                    try:
                        details = json.loads(t.details)
                    except Exception:
                        details = [d.strip() for d in re.split(r'[,;]', t.details) if d.strip()]
                db_topic_dicts.append({"topic": t.topic_name, "details": details})

    db_topic_names = [t["topic"] for t in db_topic_dicts]

    # 3. Topic matching (names only for semantic comparison)
    matching_topic_names, missing_topic_names = find_matching_missing_topics(db_topic_names, flow_topic_names)

    # 4. Build enriched matching/missing dicts for prompt
    matching_dicts = [d for d in db_topic_dicts if d["topic"] in matching_topic_names]
    missing_dicts  = [d for d in db_topic_dicts if d["topic"] in missing_topic_names]

    # 5. Compute pre-scoring hints for LLM
    total_db = len(db_topic_dicts)
    missing_main_count = len(missing_dicts)
    # Count missing details across matched topics
    missing_detail_count = 0
    for db_t in matching_dicts:
        db_details_list: list = db_t["details"]
        db_details_set = set(str(d).lower() for d in db_details_list)
        flow_t = next((f for f in flow_topic_dicts if str(f["topic"]).lower() == str(db_t["topic"]).lower()), None)
        flow_details_list: list = flow_t["details"] if flow_t else []
        flow_details_set = set(str(d).lower() for d in flow_details_list)
        missing_detail_count += len(db_details_set - flow_details_set)

    # 6. Fetch RAG context from matching topics
    context_texts = []
    if matching_topic_names:
        from .rag_service import fetch_related_files
        query_str = " ".join(matching_topic_names)
        rag_results = fetch_related_files(query_str, document_id=document_id)
        context_texts = [res.page_content for res in rag_results]

    context_str = "\n".join(context_texts) if context_texts else "No specific document context found."

    # 7. Call LLM with rich topic+details context
    prompt = get_validation_prompt(
        json.dumps(flow_data, indent=2),
        matching_dicts,
        missing_dicts,
        flow_topic_dicts,
        context_str,
        total_db=total_db,
        missing_main_count=missing_main_count,
        missing_detail_count=missing_detail_count,
    )

    response_text = call_llm(prompt, format="json", timeout=120)

    if response_text:
        # Parse JSON from response using regex for robustness
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            try:
                parsed = json.loads(json_match.group(0))
                
                # Derive is_valid from threshold
                parsed.pop("is_valid", None)
                parsed["is_valid"] = parsed["points"] >= VALID_THRESHOLD
                return parsed
            except Exception as e:
                logger.error(f"Failed to parse LLM JSON response: {e}")

        return response_text

    return {
        "is_valid": False,
        "feedback": "Failed to get a response from the evaluation service.",
        "points": 0.0,
    }