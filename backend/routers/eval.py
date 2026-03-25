import os
import requests as http_requests

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from schemas import ValidateRequest
from services.llm_service import validate_flow_with_rag, VALIDATION_MODEL, KIRAN_MODEL_NAME
from database import get_db
from models.evaluation import EvaluationResult

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

router = APIRouter()


@router.get("/models")
def list_ollama_models():
    """List available Ollama models, including kiran2.0."""
    try:
        resp = http_requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=10)
        resp.raise_for_status()
        data = resp.json()
        models = [m["name"] for m in data.get("models", [])]
        
        # Add kiran2.0 if not found in Ollama list
        if KIRAN_MODEL_NAME not in models:
            models.append(KIRAN_MODEL_NAME)
            
        return models
    except Exception as e:
        # If Ollama is down, we still return kiran2.0 if available
        return [KIRAN_MODEL_NAME]

@router.post("/evaluate")
def evaluate_flow(request: ValidateRequest, db: Session = Depends(get_db)):
    print(f"--- Starting AI Evaluation for document: {request.document_id} ---")
    print(f"Input Flow JSON: {request.flow_data}")
    
    eval_record = EvaluationResult(
        flow_data=request.flow_data,
        document_id=request.document_id,
        status="pending",
    )
    db.add(eval_record)
    try:
        db.commit()
        db.refresh(eval_record)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Could not save evaluation record: {str(e)[:500]}",
        ) from e
    
    try:
        result = validate_flow_with_rag(
            request.flow_data,
            request.document_id,
            db,
            model=request.model,
        )
        
        # Update the record with processed status and results
        eval_record.status = "processed"
        eval_record.is_valid = result.get("is_valid", False)
        eval_record.feedback = result.get("feedback", "")
        # Safely extract points
        points_val = result.get("points")
        if isinstance(points_val, (int, float)):
            eval_record.points = int(float(points_val) * 100) if float(points_val) <= 1.0 else int(points_val)
        elif isinstance(points_val, str):
            try:
                val = float(points_val)
                eval_record.points = int(val * 100) if val <= 1.0 else int(val)
            except ValueError:
                eval_record.points = 0
        else:
            eval_record.points = 0
            
        db.commit()
        db.refresh(eval_record)
        
    except Exception as e:
        print(f"Error during AI evaluation: {e}")
        eval_record.status = "failed"
        eval_record.feedback = str(e)
        db.commit()
        msg = (eval_record.feedback or "Failed to process the flow evaluation.")[:800]
        raise HTTPException(status_code=500, detail=msg)
    
    print(f"AI Response Result: {result}")
    print("--- End AI Evaluation ---")
    
    # Return a structured dictionary representing the evaluation result
    return {
        "id": eval_record.id,
        "is_valid": eval_record.is_valid,
        "feedback": eval_record.feedback,
        "points": eval_record.points,
        "status": eval_record.status,
        "model": request.model or VALIDATION_MODEL,
    }
