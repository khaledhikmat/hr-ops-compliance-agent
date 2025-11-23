from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import json

from ..database import get_db, User, Report, Document, Issue
from ..schemas import ReportCreate, Report as ReportSchema
from ..auth import get_current_user

router = APIRouter()

def generate_report_summary(documents, issues, severity_counts, category_groups) -> str:
    """Generate markdown report summary"""
    total_issues = len(issues)
    critical_and_high = severity_counts.get("critical", 0) + severity_counts.get("high", 0)

    summary = f"# HR Compliance Audit Report\n\n"
    summary += f"## Executive Summary\n\n"
    summary += f"This report analyzes {len(documents)} document(s) for HR compliance issues.\n\n"
    summary += f"**Total Issues Identified:** {total_issues}\n\n"

    summary += f"### Issues by Severity\n"
    summary += f"- **Critical:** {severity_counts.get('critical', 0)}\n"
    summary += f"- **High:** {severity_counts.get('high', 0)}\n"
    summary += f"- **Medium:** {severity_counts.get('medium', 0)}\n"
    summary += f"- **Low:** {severity_counts.get('low', 0)}\n"
    summary += f"- **Info:** {severity_counts.get('info', 0)}\n\n"

    if critical_and_high > 0:
        summary += f"**⚠️ Immediate Action Required:** {critical_and_high} critical or high-severity issues require immediate attention.\n\n"

    summary += f"## Documents Analyzed\n\n"
    for idx, doc in enumerate(documents, 1):
        summary += f"{idx}. **{doc.title}** ({doc.file_name})\n"

    summary += f"\n## Issues by Category\n\n"
    sorted_categories = sorted(category_groups.items(), key=lambda x: len(x[1]), reverse=True)
    for category, cat_issues in sorted_categories:
        summary += f"### {category} ({len(cat_issues)} issues)\n\n"
        for issue in cat_issues[:3]:
            summary += f"- **[{issue.severity.upper()}]** {issue.title}\n"
            summary += f"  {issue.description[:150]}...\n\n"
        if len(cat_issues) > 3:
            summary += f"  *...and {len(cat_issues) - 3} more issues*\n\n"

    summary += f"\n## Recommendations\n\n"
    summary += f"1. Address all critical and high-severity issues immediately\n"
    summary += f"2. Review and update policies to comply with current regulations\n"
    summary += f"3. Consult with legal counsel for jurisdiction-specific requirements\n"
    summary += f"4. Implement a regular compliance review schedule\n"
    summary += f"5. Train HR staff on updated policies and procedures\n\n"

    summary += f"---\n\n"
    summary += f"*Report generated on {datetime.now().strftime('%Y-%m-%d at %H:%M:%S')}*\n"

    return summary

@router.post("/generate")
async def generate_report(
    report_data: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not report_data.document_ids:
        raise HTTPException(
            status_code=400,
            detail="At least one document ID is required"
        )

    # Verify documents belong to user
    documents = db.query(Document).filter(
        Document.id.in_(report_data.document_ids),
        Document.user_id == current_user.id
    ).all()

    if len(documents) != len(report_data.document_ids):
        raise HTTPException(
            status_code=403,
            detail="Unauthorized access to some documents"
        )

    # Get all issues for these documents
    issues = db.query(Issue).filter(
        Issue.document_id.in_(report_data.document_ids)
    ).all()

    # Group issues by severity
    severity_counts = {
        "critical": 0,
        "high": 0,
        "medium": 0,
        "low": 0,
        "info": 0
    }

    category_groups = {}

    for issue in issues:
        severity_counts[issue.severity] = severity_counts.get(issue.severity, 0) + 1

        if issue.category not in category_groups:
            category_groups[issue.category] = []
        category_groups[issue.category].append(issue)

    # Generate summary
    summary = generate_report_summary(documents, issues, severity_counts, category_groups)

    # Save report
    db_report = Report(
        user_id=current_user.id,
        title=report_data.title,
        document_ids=json.dumps(report_data.document_ids),
        summary=summary
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)

    return {
        **ReportSchema.from_orm(db_report).dict(),
        "documents": documents,
        "issues": issues,
        "severityCounts": severity_counts,
        "categoryGroups": category_groups
    }

@router.get("/", response_model=list[ReportSchema])
async def get_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reports = db.query(Report).filter(
        Report.user_id == current_user.id
    ).order_by(Report.generated_at.desc()).all()

    return [ReportSchema.from_orm(r) for r in reports]

@router.get("/{report_id}")
async def get_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(
        Report.id == report_id,
        Report.user_id == current_user.id
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Get associated documents and issues
    document_ids = json.loads(report.document_ids)

    documents = db.query(Document).filter(
        Document.id.in_(document_ids)
    ).all()

    issues = db.query(Issue).filter(
        Issue.document_id.in_(document_ids)
    ).all()

    # Group issues
    severity_counts = {
        "critical": 0,
        "high": 0,
        "medium": 0,
        "low": 0,
        "info": 0
    }

    category_groups = {}

    for issue in issues:
        severity_counts[issue.severity] = severity_counts.get(issue.severity, 0) + 1
        if issue.category not in category_groups:
            category_groups[issue.category] = []
        category_groups[issue.category].append(issue)

    return {
        **ReportSchema.from_orm(report).dict(),
        "documents": documents,
        "issues": issues,
        "severityCounts": severity_counts,
        "categoryGroups": category_groups
    }

@router.delete("/{report_id}")
async def delete_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(
        Report.id == report_id,
        Report.user_id == current_user.id
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    db.delete(report)
    db.commit()

    return {"message": "Report deleted successfully"}
