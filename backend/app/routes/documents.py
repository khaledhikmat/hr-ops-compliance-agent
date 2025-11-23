from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime
import os
import shutil

from ..database import get_db, User, Document, Issue
from ..schemas import Document as DocumentSchema, DocumentWithIssues
from ..auth import get_current_user
from ..services.document_parser import parse_document
from ..services.compliance_analyzer import analyze_compliance

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def process_document(document_id: int, file_path: str, file_type: str, title: str, db_session):
    """Background task to analyze document"""
    try:
        # Update status to analyzing
        doc = db_session.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = "analyzing"
            db_session.commit()

        # Parse document
        content = parse_document(file_path, file_type)

        # Update content
        doc = db_session.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.content = content
            db_session.commit()

        # Analyze compliance
        analysis = await analyze_compliance(content, title)

        # Insert issues
        for issue_data in analysis["issues"]:
            issue = Issue(
                document_id=document_id,
                severity=issue_data["severity"],
                category=issue_data["category"],
                title=issue_data["title"],
                description=issue_data["description"],
                location=issue_data.get("location"),
                recommendation=issue_data["recommendation"],
                jurisdiction=issue_data.get("jurisdiction")
            )
            db_session.add(issue)

        # Update document status
        doc = db_session.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = "completed"
            doc.analyzed_at = datetime.utcnow()
            db_session.commit()

        print(f"Document {document_id} analyzed successfully")

    except Exception as e:
        print(f"Error analyzing document: {e}")
        doc = db_session.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = "failed"
            db_session.commit()
    finally:
        db_session.close()

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate file type
    allowed_types = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "text/plain"
    ]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only PDF, Word, and text files are allowed."
        )

    # Save file
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{datetime.now().timestamp()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Create document record
    db_document = Document(
        user_id=current_user.id,
        title=title,
        file_name=file.filename,
        file_type=file.content_type,
        file_path=file_path,
        content="",
        status="pending"
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)

    # Start background analysis
    from ..database import SessionLocal
    background_tasks.add_task(
        process_document,
        db_document.id,
        file_path,
        file.content_type,
        title,
        SessionLocal()
    )

    return {
        "id": db_document.id,
        "message": "Document uploaded successfully. Analysis in progress."
    }

@router.get("/", response_model=list[DocumentSchema])
async def get_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    documents = db.query(Document).filter(
        Document.user_id == current_user.id
    ).order_by(Document.uploaded_at.desc()).all()

    return [DocumentSchema.from_orm(doc) for doc in documents]

@router.get("/{document_id}", response_model=DocumentWithIssues)
async def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return DocumentWithIssues.from_orm(document)

@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete file
    if document.file_path and os.path.exists(document.file_path):
        os.remove(document.file_path)

    # Delete database record
    db.delete(document)
    db.commit()

    return {"message": "Document deleted successfully"}
