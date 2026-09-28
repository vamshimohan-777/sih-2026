import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from backend.app.database import get_db, Document, User
from backend.app.auth import get_current_user, require_role
from backend.app.audit import log_action

router = APIRouter(prefix="/api/documents", tags=["documents"])

class DocumentResponse(BaseModel):
    id: str
    title: str
    classification: str
    description: str
    created_at: datetime.datetime
    created_by: str

class DocumentCreate(BaseModel):
    title: str
    classification: str
    description: str
    image_b64: str

@router.get("", response_model=List[DocumentResponse])
def list_documents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # All users can see the list of documents
    docs = db.query(Document).all()
    return [
        DocumentResponse(
            id=d.id,
            title=d.title,
            classification=d.classification,
            description=d.description,
            created_at=d.created_at,
            created_by=d.created_by
        ) for d in docs
    ]

@router.get("/{doc_id}")
def get_document(doc_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {
        "id": doc.id,
        "title": doc.title,
        "classification": doc.classification,
        "description": doc.description,
        "image_b64": doc.image_b64,
        "created_at": doc.created_at,
        "created_by": doc.created_by
    }

@router.post("", response_model=DocumentResponse)
def create_document(
    doc_in: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "SUPERADMIN"))
):
    new_doc = Document(
        id=str(uuid.uuid4()),
        title=doc_in.title,
        classification=doc_in.classification,
        description=doc_in.description,
        image_b64=doc_in.image_b64,
        created_at=datetime.datetime.utcnow(),
        created_by=current_user.id
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    log_action(db, "DOCUMENT_CREATED", current_user.id, "Document", new_doc.id, f"Created document: {new_doc.title}")
    
    return DocumentResponse(
        id=new_doc.id,
        title=new_doc.title,
        classification=new_doc.classification,
        description=new_doc.description,
        created_at=new_doc.created_at,
        created_by=new_doc.created_by
    )
