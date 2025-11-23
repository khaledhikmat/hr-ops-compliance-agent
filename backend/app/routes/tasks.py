from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime
from typing import Optional

from ..database import get_db, User, Task, Issue, Document
from ..schemas import TaskCreate, TaskUpdate, Task as TaskSchema
from ..auth import get_current_user

router = APIRouter()

@router.get("")
async def get_tasks(
    status: Optional[str] = Query(None),
    assigned_to: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Build query for tasks user has access to
    query = db.query(
        Task,
        Issue.title.label("issue_title"),
        Issue.severity,
        Document.title.label("document_title")
    ).join(Issue).join(Document).filter(
        or_(
            Task.assigned_to == current_user.id,
            Task.assigned_by == current_user.id,
            Document.user_id == current_user.id
        )
    )

    if status:
        query = query.filter(Task.status == status)

    if assigned_to:
        query = query.filter(Task.assigned_to == assigned_to)

    results = query.order_by(Task.created_at.desc()).all()

    return [
        {
            **TaskSchema.from_orm(task).dict(),
            "issue_title": issue_title,
            "severity": severity,
            "document_title": document_title
        }
        for task, issue_title, severity, document_title in results
    ]

@router.post("", response_model=TaskSchema)
async def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify issue exists and user has access
    issue = db.query(Issue).join(Document).filter(
        Issue.id == task_data.issue_id,
        Document.user_id == current_user.id
    ).first()

    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    # Create task
    db_task = Task(
        issue_id=task_data.issue_id,
        title=task_data.title,
        description=task_data.description,
        assigned_to=task_data.assigned_to,
        assigned_by=current_user.id,
        due_date=task_data.due_date
    )

    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    return TaskSchema.from_orm(db_task)

@router.patch("/{task_id}", response_model=TaskSchema)
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify task exists and user has access
    task = db.query(Task).join(Issue).join(Document).filter(
        Task.id == task_id,
        or_(
            Task.assigned_to == current_user.id,
            Task.assigned_by == current_user.id,
            Document.user_id == current_user.id
        )
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Update fields
    if task_data.status is not None:
        task.status = task_data.status
        if task_data.status == "completed":
            task.completed_at = datetime.utcnow()

    if task_data.assigned_to is not None:
        task.assigned_to = task_data.assigned_to

    if task_data.due_date is not None:
        task.due_date = task_data.due_date

    if task_data.description is not None:
        task.description = task_data.description

    db.commit()
    db.refresh(task)

    return TaskSchema.from_orm(task)

@router.delete("/{task_id}")
async def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).join(Issue).join(Document).filter(
        Task.id == task_id,
        or_(
            Task.assigned_by == current_user.id,
            Document.user_id == current_user.id
        )
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found or unauthorized"
        )

    db.delete(task)
    db.commit()

    return {"message": "Task deleted successfully"}
