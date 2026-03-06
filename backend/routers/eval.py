from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from schemas import ValidateRequest
from services.llm_service import validate_flow_with_rag
from database import get_db
from models.evaluation import EvaluationResult

router = APIRouter()

@router.post("/evaluate")
def evaluate_flow(request: ValidateRequest, db: Session = Depends(get_db)):
    print(f"--- Starting AI Evaluation for exercise: {request.exercise_id or 'Default'} ---")
    print(f"Input Flow JSON: {request.flow_data}")
    
    # Create the pending record
    eval_record = EvaluationResult(
        flow_data=request.flow_data,
        course_id=request.course_id,
        module_id=request.module_id,
        exercise_id=request.exercise_id,
        status="pending"
    )
    db.add(eval_record)
    db.commit()
    db.refresh(eval_record)
    
    try:
        result = validate_flow_with_rag(
            request.flow_data, 
            request.course_id, 
            request.module_id, 
            request.exercise_id,
            db
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
        # Mark as failed if necessary
        eval_record.status = "failed"
        eval_record.feedback = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail="Internal Server Error: Failed to process the flow evaluation.")
    
    print(f"AI Response Result: {result}")
    print("--- End AI Evaluation ---")
    
    # Return a structured dictionary representing the evaluation result
    return {
        "id": eval_record.id,
        "is_valid": eval_record.is_valid,
        "feedback": eval_record.feedback,
        "points": eval_record.points,
        "status": eval_record.status
    }
