import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { db } from '../database/schema.js';
import type { Task } from '../types/index.js';

const router = express.Router();

// Get all tasks (optionally filter by status or assignee)
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { status, assigned_to } = req.query;

  let query = `
    SELECT t.*, i.title as issue_title, i.severity, d.title as document_title
    FROM tasks t
    JOIN issues i ON t.issue_id = i.id
    JOIN documents d ON i.document_id = d.id
    WHERE (t.assigned_to = ? OR t.assigned_by = ? OR d.user_id = ?)
  `;

  const params: any[] = [userId, userId, userId];

  if (status) {
    query += ' AND t.status = ?';
    params.push(status);
  }

  if (assigned_to) {
    query += ' AND t.assigned_to = ?';
    params.push(assigned_to);
  }

  query += ' ORDER BY t.created_at DESC';

  const tasks = db.prepare(query).all(...params);
  res.json(tasks);
});

// Create task
router.post(
  '/',
  authenticateToken,
  [
    body('issue_id').isInt(),
    body('title').trim().notEmpty(),
    body('assigned_to').optional().isInt(),
    body('due_date').optional().isISO8601(),
  ],
  (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.userId!;
    const { issue_id, title, description, assigned_to, due_date } = req.body;

    try {
      // Verify issue exists and user has access
      const issue = db
        .prepare(
          `SELECT i.* FROM issues i
           JOIN documents d ON i.document_id = d.id
           WHERE i.id = ? AND d.user_id = ?`
        )
        .get(issue_id, userId);

      if (!issue) {
        return res.status(404).json({ error: 'Issue not found' });
      }

      const stmt = db.prepare(
        `INSERT INTO tasks (issue_id, assigned_to, assigned_by, title, description, due_date)
         VALUES (?, ?, ?, ?, ?, ?)`
      );

      const result = stmt.run(
        issue_id,
        assigned_to || null,
        userId,
        title,
        description || null,
        due_date || null
      );

      const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid) as Task;
      res.json(task);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  }
);

// Update task
router.patch('/:id', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.userId!;
  const taskId = req.params.id;
  const { status, assigned_to, due_date, description } = req.body;

  // Verify task exists and user has access
  const task = db
    .prepare(
      `SELECT t.* FROM tasks t
       JOIN issues i ON t.issue_id = i.id
       JOIN documents d ON i.document_id = d.id
       WHERE t.id = ? AND (t.assigned_to = ? OR t.assigned_by = ? OR d.user_id = ?)`
    )
    .get(taskId, userId, userId, userId) as Task | undefined;

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (status !== undefined) {
    updates.push('status = ?');
    params.push(status);

    if (status === 'completed') {
      updates.push('completed_at = CURRENT_TIMESTAMP');
    }
  }

  if (assigned_to !== undefined) {
    updates.push('assigned_to = ?');
    params.push(assigned_to);
  }

  if (due_date !== undefined) {
    updates.push('due_date = ?');
    params.push(due_date);
  }

  if (description !== undefined) {
    updates.push('description = ?');
    params.push(description);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No updates provided' });
  }

  params.push(taskId);
  const query = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`;

  db.prepare(query).run(...params);

  const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as Task;
  res.json(updatedTask);
});

// Delete task
router.delete('/:id', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.userId!;
  const taskId = req.params.id;

  // Verify task exists and user has access
  const task = db
    .prepare(
      `SELECT t.* FROM tasks t
       JOIN issues i ON t.issue_id = i.id
       JOIN documents d ON i.document_id = d.id
       WHERE t.id = ? AND (t.assigned_by = ? OR d.user_id = ?)`
    )
    .get(taskId, userId, userId) as Task | undefined;

  if (!task) {
    return res.status(404).json({ error: 'Task not found or unauthorized' });
  }

  db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
  res.json({ message: 'Task deleted successfully' });
});

export default router;
