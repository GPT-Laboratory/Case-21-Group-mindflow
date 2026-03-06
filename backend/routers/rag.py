from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil

from database import get_db
from models.document import Document
from schemas import DocumentResponse
from services.rag_service import (
    process_file_and_embed, 
    delete_related_files, 
    fetch_related_files
)

router = APIRouter()

UPLOAD_DIR = "docfiles"

def process_document_background(
    file_path: str, 
    filename: str, 
    doc_id: int, 
    db: Session,
    course_id: Optional[str] = None,
    module_id: Optional[str] = None,
    exercise_id: Optional[str] = None
):
    try:
        # Generate embeddings and extract/save topics
        success = process_file_and_embed(
            file_path, 
            filename, 
            doc_id=doc_id,
            db=db,
            course_id=course_id, 
            module_id=module_id, 
            exercise_id=exercise_id
        )
        if success:
            db_doc = db.query(Document).filter(Document.id == doc_id).first()
            if db_doc:
                db_doc.processing_status = "processed"
                db.commit()
    except Exception as e:
        print(f"Error processing document {filename}: {e}")
        db_doc = db.query(Document).filter(Document.id == doc_id).first()
        if db_doc:
            db_doc.processing_status = "failed"
            db.commit()

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    course_id: Optional[str] = Form(None),
    module_id: Optional[str] = Form(None),
    module_name: Optional[str] = Form(None),
    exercise_id: Optional[str] = Form(None),
    exercise_name: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    db_document = Document(
        filename=file.filename,
        doc_path=file_path,
        course_id=course_id,
        module_id=module_id,
        module_name=module_name,
        exercise_id=exercise_id,
        exercise_name=exercise_name,
        processing_status="processing"
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    # Process in background
    background_tasks.add_task(
        process_document_background, 
        file_path, 
        file.filename,
        db_document.id,
        db,
        course_id=course_id,
        module_id=module_id,
        exercise_id=exercise_id
    )
    
    return db_document

@router.get("/documents", response_model=List[DocumentResponse])
def get_documents(
    course_id: Optional[str] = None,
    module_id: Optional[str] = None,
    exercise_id: Optional[str] = None, 
    db: Session = Depends(get_db)
):

    query = db.query(Document)

    if course_id is not None:
        query = query.filter(Document.course_id == course_id)

    if module_id is not None:
        query = query.filter(Document.module_id == module_id)

    if exercise_id is not None:
        query = query.filter(Document.exercise_id == exercise_id)

    return query.all()

@router.delete("/documents/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    db_doc = db.query(Document).filter(Document.id == doc_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Remove from vector db
    delete_related_files(
        db_doc.filename, 
        db_doc.course_id, 
        db_doc.module_id, 
        db_doc.exercise_id
    )
    
    # Remove from disk if exists
    if db_doc.doc_path and os.path.exists(db_doc.doc_path):
        try:
            os.remove(db_doc.doc_path)
        except OSError:
            pass
            
    # Remove from SQL
    db.delete(db_doc)
    db.commit()
    return {"message": "Document deleted successfully"}

@router.get("/search")
def search_docs(
    query: str, 
    course_id: str,
    module_id: str,
    exercise_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    results = fetch_related_files(
        query, 
        course_id, 
        module_id, 
        exercise_id=exercise_id,
        db=db
    )
    return [{"content": doc.page_content, "metadata": doc.metadata} for doc in results]
