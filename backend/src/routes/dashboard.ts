import express from 'express';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { db } from '../database/schema.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.userId!;

  try {
    // Total documents
    const totalDocuments = db
      .prepare('SELECT COUNT(*) as count FROM documents WHERE user_id = ?')
      .get(userId) as { count: number };

    // Documents by status
    const documentsByStatus = db
      .prepare(
        `SELECT status, COUNT(*) as count
         FROM documents
         WHERE user_id = ?
         GROUP BY status`
      )
      .all(userId) as Array<{ status: string; count: number }>;

    // Total issues
    const totalIssues = db
      .prepare(
        `SELECT COUNT(*) as count
         FROM issues i
         JOIN documents d ON i.document_id = d.id
         WHERE d.user_id = ?`
      )
      .get(userId) as { count: number };

    // Issues by severity
    const issuesBySeverity = db
      .prepare(
        `SELECT i.severity, COUNT(*) as count
         FROM issues i
         JOIN documents d ON i.document_id = d.id
         WHERE d.user_id = ?
         GROUP BY i.severity`
      )
      .all(userId) as Array<{ severity: string; count: number }>;

    // Issues by category
    const issuesByCategory = db
      .prepare(
        `SELECT i.category, COUNT(*) as count
         FROM issues i
         JOIN documents d ON i.document_id = d.id
         WHERE d.user_id = ?
         GROUP BY i.category
         ORDER BY count DESC
         LIMIT 10`
      )
      .all(userId) as Array<{ category: string; count: number }>;

    // Total tasks
    const totalTasks = db
      .prepare(
        `SELECT COUNT(*) as count
         FROM tasks t
         JOIN issues i ON t.issue_id = i.id
         JOIN documents d ON i.document_id = d.id
         WHERE d.user_id = ?`
      )
      .get(userId) as { count: number };

    // Tasks by status
    const tasksByStatus = db
      .prepare(
        `SELECT t.status, COUNT(*) as count
         FROM tasks t
         JOIN issues i ON t.issue_id = i.id
         JOIN documents d ON i.document_id = d.id
         WHERE d.user_id = ?
         GROUP BY t.status`
      )
      .all(userId) as Array<{ status: string; count: number }>;

    // Recent activity
    const recentDocuments = db
      .prepare(
        `SELECT id, title, status, uploaded_at, analyzed_at
         FROM documents
         WHERE user_id = ?
         ORDER BY uploaded_at DESC
         LIMIT 5`
      )
      .all(userId);

    res.json({
      documents: {
        total: totalDocuments.count,
        byStatus: documentsByStatus,
      },
      issues: {
        total: totalIssues.count,
        bySeverity: issuesBySeverity,
        byCategory: issuesByCategory,
      },
      tasks: {
        total: totalTasks.count,
        byStatus: tasksByStatus,
      },
      recentDocuments,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

export default router;
