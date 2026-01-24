from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional

from backend.database import get_session, User
from backend.auth import get_current_user
from backend.estate_models import Document

router = APIRouter(prefix="/api/data/vault_documents", tags=["documents"])

@router.get("/", response_model=List[Document])
def get_documents(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    """Retrieve all documents for the current user."""
    documents = session.exec(select(Document).where(Document.user_id == user.id)).all()
    return documents

@router.post("/", response_model=Document)
def create_document(
    document: Document,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    """Create a new document."""
    document.user_id = user.id
    session.add(document)
    session.commit()
    session.refresh(document)
    return document

@router.put("/{document_id}", response_model=Document)
def update_document(
    document_id: int,
    document_update: Document,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    """Update an existing document."""
    db_document = session.exec(
        select(Document).where(Document.id == document_id, Document.user_id == user.id)
    ).first()
    
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Update fields
    document_data = document_update.model_dump(exclude_unset=True)
    for key, value in document_data.items():
        if key != "id" and key != "user_id":
             setattr(db_document, key, value)
            
    session.add(db_document)
    session.commit()
    session.refresh(db_document)
    return db_document

@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    """Delete a document."""
    db_document = session.exec(
        select(Document).where(Document.id == document_id, Document.user_id == user.id)
    ).first()
    
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    session.delete(db_document)
    session.commit()
    return {"status": "deleted"}
