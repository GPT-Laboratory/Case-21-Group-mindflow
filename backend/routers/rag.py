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
    db: Session
):
    try:
        # Generate embeddings and extract/save topics
        success = process_file_and_embed(
            file_path, 
            filename, 
            doc_id=doc_id,
            db=db
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
    db: Session = Depends(get_db)
):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    db_document = Document(
        filename=file.filename,
        doc_path=file_path,
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
        db
    )
    
    return db_document

@router.get("/documents", response_model=List[DocumentResponse])
def get_documents(db: Session = Depends(get_db)):
    return db.query(Document).all()

@router.delete("/documents/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    db_doc = db.query(Document).filter(Document.id == doc_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Remove from vector db
    delete_related_files(
        db_doc.filename, 
        db_doc.id
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

@router.get("/documents/{doc_id}/blob")
def fetch_document_blob(doc_id: int, db: Session = Depends(get_db)):
    db_doc = db.query(Document).filter(Document.id == doc_id).first()
    if not db_doc or not db_doc.doc_path or not os.path.exists(db_doc.doc_path):
        raise HTTPException(status_code=404, detail="Document content not found")
    
    from fastapi.responses import FileResponse
    return FileResponse(
        path=db_doc.doc_path, 
        filename=db_doc.filename,
        media_type='application/octet-stream'
    )

@router.get("/search")
def search_docs(
    query: str, 
    document_id: int,
    db: Session = Depends(get_db)
):
    results = fetch_related_files(
        query, 
        document_id=document_id,
        db=db
    )
    return [{"content": doc.page_content, "metadata": doc.metadata} for doc in results]
