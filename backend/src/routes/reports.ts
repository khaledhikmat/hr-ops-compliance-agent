import express from 'express';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { db } from '../database/schema.js';
import type { Document, Issue, Report } from '../types/index.js';

const router = express.Router();

// Generate report
router.post('/generate', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { title, document_ids } = req.body;

  if (!title || !document_ids || !Array.isArray(document_ids) || document_ids.length === 0) {
    return res.status(400).json({ error: 'Title and document IDs are required' });
  }

  try {
    // Verify all documents belong to user
    const placeholders = document_ids.map(() => '?').join(',');
    const documents = db
      .prepare(`SELECT * FROM documents WHERE id IN (${placeholders}) AND user_id = ?`)
      .all(...document_ids, userId) as Document[];

    if (documents.length !== document_ids.length) {
      return res.status(403).json({ error: 'Unauthorized access to some documents' });
    }

    // Get all issues for these documents
    const issues = db
      .prepare(`SELECT * FROM issues WHERE document_id IN (${placeholders})`)
      .all(...document_ids) as Issue[];

    // Group issues by severity
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    const categoryGroups: Record<string, Issue[]> = {};

    issues.forEach((issue) => {
      severityCounts[issue.severity]++;

      if (!categoryGroups[issue.category]) {
        categoryGroups[issue.category] = [];
      }
      categoryGroups[issue.category].push(issue);
    });

    // Generate summary
    const summary = generateReportSummary(documents, issues, severityCounts, categoryGroups);

    // Save report
    const stmt = db.prepare(
      'INSERT INTO reports (user_id, title, document_ids, summary) VALUES (?, ?, ?, ?)'
    );

    const result = stmt.run(userId, title, JSON.stringify(document_ids), summary);

    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(result.lastInsertRowid) as Report;

    res.json({
      ...report,
      documents,
      issues,
      severityCounts,
      categoryGroups,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Get all reports
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.userId!;
  const reports = db.prepare('SELECT * FROM reports WHERE user_id = ? ORDER BY generated_at DESC').all(userId) as Report[];
  res.json(reports);
});

// Get single report
router.get('/:id', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.userId!;
  const reportId = req.params.id;

  const report = db.prepare('SELECT * FROM reports WHERE id = ? AND user_id = ?').get(reportId, userId) as Report | undefined;

  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  // Get associated documents and issues
  const documentIds = JSON.parse(report.document_ids);
  const placeholders = documentIds.map(() => '?').join(',');

  const documents = db.prepare(`SELECT * FROM documents WHERE id IN (${placeholders})`).all(...documentIds) as Document[];

  const issues = db.prepare(`SELECT * FROM issues WHERE document_id IN (${placeholders})`).all(...documentIds) as Issue[];

  // Group issues by severity
  const severityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  const categoryGroups: Record<string, Issue[]> = {};

  issues.forEach((issue) => {
    severityCounts[issue.severity]++;
    if (!categoryGroups[issue.category]) {
      categoryGroups[issue.category] = [];
    }
    categoryGroups[issue.category].push(issue);
  });

  res.json({
    ...report,
    documents,
    issues,
    severityCounts,
    categoryGroups,
  });
});

// Delete report
router.delete('/:id', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.userId!;
  const reportId = req.params.id;

  const report = db.prepare('SELECT * FROM reports WHERE id = ? AND user_id = ?').get(reportId, userId) as Report | undefined;

  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  db.prepare('DELETE FROM reports WHERE id = ?').run(reportId);
  res.json({ message: 'Report deleted successfully' });
});

function generateReportSummary(
  documents: Document[],
  issues: Issue[],
  severityCounts: Record<string, number>,
  categoryGroups: Record<string, Issue[]>
): string {
  const totalIssues = issues.length;
  const criticalAndHigh = severityCounts.critical + severityCounts.high;

  let summary = `# HR Compliance Audit Report\n\n`;
  summary += `## Executive Summary\n\n`;
  summary += `This report analyzes ${documents.length} document(s) for HR compliance issues.\n\n`;
  summary += `**Total Issues Identified:** ${totalIssues}\n\n`;

  summary += `### Issues by Severity\n`;
  summary += `- **Critical:** ${severityCounts.critical}\n`;
  summary += `- **High:** ${severityCounts.high}\n`;
  summary += `- **Medium:** ${severityCounts.medium}\n`;
  summary += `- **Low:** ${severityCounts.low}\n`;
  summary += `- **Info:** ${severityCounts.info}\n\n`;

  if (criticalAndHigh > 0) {
    summary += `**⚠️ Immediate Action Required:** ${criticalAndHigh} critical or high-severity issues require immediate attention.\n\n`;
  }

  summary += `## Documents Analyzed\n\n`;
  documents.forEach((doc, idx) => {
    summary += `${idx + 1}. **${doc.title}** (${doc.file_name})\n`;
  });

  summary += `\n## Issues by Category\n\n`;
  Object.entries(categoryGroups)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([category, catIssues]) => {
      summary += `### ${category} (${catIssues.length} issues)\n\n`;

      catIssues.slice(0, 3).forEach((issue) => {
        summary += `- **[${issue.severity.toUpperCase()}]** ${issue.title}\n`;
        summary += `  ${issue.description.substring(0, 150)}...\n\n`;
      });

      if (catIssues.length > 3) {
        summary += `  *...and ${catIssues.length - 3} more issues*\n\n`;
      }
    });

  summary += `\n## Recommendations\n\n`;
  summary += `1. Address all critical and high-severity issues immediately\n`;
  summary += `2. Review and update policies to comply with current regulations\n`;
  summary += `3. Consult with legal counsel for jurisdiction-specific requirements\n`;
  summary += `4. Implement a regular compliance review schedule\n`;
  summary += `5. Train HR staff on updated policies and procedures\n\n`;

  summary += `---\n\n`;
  summary += `*Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*\n`;

  return summary;
}

export default router;
