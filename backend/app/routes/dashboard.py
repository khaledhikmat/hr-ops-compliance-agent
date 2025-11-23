from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db, User, Document, Issue, Task
from ..auth import get_current_user

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Total documents
    total_documents = db.query(func.count(Document.id)).filter(
        Document.user_id == current_user.id
    ).scalar()

    # Documents by status
    documents_by_status = db.query(
        Document.status,
        func.count(Document.id).label("count")
    ).filter(
        Document.user_id == current_user.id
    ).group_by(Document.status).all()

    # Total issues
    total_issues = db.query(func.count(Issue.id)).join(Document).filter(
        Document.user_id == current_user.id
    ).scalar()

    # Issues by severity
    issues_by_severity = db.query(
        Issue.severity,
        func.count(Issue.id).label("count")
    ).join(Document).filter(
        Document.user_id == current_user.id
    ).group_by(Issue.severity).all()

    # Issues by category
    issues_by_category = db.query(
        Issue.category,
        func.count(Issue.id).label("count")
    ).join(Document).filter(
        Document.user_id == current_user.id
    ).group_by(Issue.category).order_by(func.count(Issue.id).desc()).limit(10).all()

    # Total tasks
    total_tasks = db.query(func.count(Task.id)).join(Issue).join(Document).filter(
        Document.user_id == current_user.id
    ).scalar()

    # Tasks by status
    tasks_by_status = db.query(
        Task.status,
        func.count(Task.id).label("count")
    ).join(Issue).join(Document).filter(
        Document.user_id == current_user.id
    ).group_by(Task.status).all()

    # Recent documents
    recent_documents = db.query(Document).filter(
        Document.user_id == current_user.id
    ).order_by(Document.uploaded_at.desc()).limit(5).all()

    return {
        "documents": {
            "total": total_documents,
            "byStatus": [{"status": status, "count": count} for status, count in documents_by_status]
        },
        "issues": {
            "total": total_issues,
            "bySeverity": [{"severity": severity, "count": count} for severity, count in issues_by_severity],
            "byCategory": [{"category": category, "count": count} for category, count in issues_by_category]
        },
        "tasks": {
            "total": total_tasks,
            "byStatus": [{"status": status, "count": count} for status, count in tasks_by_status]
        },
        "recentDocuments": [
            {
                "id": doc.id,
                "title": doc.title,
                "status": doc.status,
                "uploaded_at": doc.uploaded_at.isoformat()
            }
            for doc in recent_documents
        ]
    }
