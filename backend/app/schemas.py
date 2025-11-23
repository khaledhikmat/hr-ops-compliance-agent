from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: int
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class UserWithToken(BaseModel):
    token: str
    user: User

# Document schemas
class DocumentBase(BaseModel):
    title: str

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: int
    user_id: int
    file_name: str
    file_type: str
    status: str
    uploaded_at: datetime
    analyzed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Issue schemas
class IssueBase(BaseModel):
    severity: str
    category: str
    title: str
    description: str
    location: Optional[str] = None
    recommendation: str
    jurisdiction: Optional[str] = None

class Issue(IssueBase):
    id: int
    document_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentWithIssues(Document):
    issues: List[Issue] = []

# Task schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to: Optional[int] = None
    due_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    issue_id: int

class TaskUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[int] = None
    due_date: Optional[datetime] = None
    description: Optional[str] = None

class Task(TaskBase):
    id: int
    issue_id: int
    assigned_by: int
    status: str
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Report schemas
class ReportCreate(BaseModel):
    title: str
    document_ids: List[int]

class Report(BaseModel):
    id: int
    user_id: int
    title: str
    document_ids: str
    summary: str
    generated_at: datetime

    class Config:
        from_attributes = True
