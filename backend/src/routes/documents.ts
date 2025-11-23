import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { db } from '../database/schema.js';
import { parseDocument } from '../services/documentParser.js';
import { analyzeCompliance } from '../services/complianceAnalyzer.js';
import type { Document, Issue } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, and text files are allowed.'));
    }
  },
});

// Upload and analyze document
router.post('/upload', authenticateToken, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Document title is required' });
    }

    const userId = req.userId!;
    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const fileType = req.file.mimetype;

    // Insert document record
    const insertDoc = db.prepare(
      `INSERT INTO documents (user_id, title, file_name, file_type, file_path, content, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    const result = insertDoc.run(userId, title, fileName, fileType, filePath, '', 'pending');
    const documentId = result.lastInsertRowid;

    // Parse document in background
    setImmediate(async () => {
      try {
        // Update status to analyzing
        db.prepare('UPDATE documents SET status = ? WHERE id = ?').run('analyzing', documentId);

        // Parse document content
        const content = await parseDocument(filePath, fileType);

        // Update document with content
        db.prepare('UPDATE documents SET content = ? WHERE id = ?').run(content, documentId);

        // Analyze compliance
        const analysis = await analyzeCompliance(content, title);

        // Insert issues
        const insertIssue = db.prepare(
          `INSERT INTO issues (document_id, severity, category, title, description, location, recommendation, jurisdiction)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        );

        for (const issue of analysis.issues) {
          insertIssue.run(
            documentId,
            issue.severity,
            issue.category,
            issue.title,
            issue.description,
            issue.location || null,
            issue.recommendation,
            issue.jurisdiction || null
          );
        }

        // Update document status
        db.prepare('UPDATE documents SET status = ?, analyzed_at = CURRENT_TIMESTAMP WHERE id = ?').run(
          'completed',
          documentId
        );

        console.log(`Document ${documentId} analyzed successfully`);
      } catch (error) {
        console.error('Error analyzing document:', error);
        db.prepare('UPDATE documents SET status = ? WHERE id = ?').run('failed', documentId);
      }
    });

    res.json({
      id: documentId,
      message: 'Document uploaded successfully. Analysis in progress.',
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Get all documents for user
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.userId!;
  const documents = db.prepare('SELECT * FROM documents WHERE user_id = ? ORDER BY uploaded_at DESC').all(userId) as Document[];
  res.json(documents);
});

// Get single document with issues
router.get('/:id', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.userId!;
  const documentId = req.params.id;

  const document = db.prepare('SELECT * FROM documents WHERE id = ? AND user_id = ?').get(documentId, userId) as Document | undefined;

  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const issues = db.prepare('SELECT * FROM issues WHERE document_id = ? ORDER BY severity, created_at').all(documentId) as Issue[];

  res.json({ ...document, issues });
});

// Delete document
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const documentId = req.params.id;

  const document = db.prepare('SELECT * FROM documents WHERE id = ? AND user_id = ?').get(documentId, userId) as Document | undefined;

  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // Delete file
  if (document.file_path) {
    try {
      await fs.unlink(document.file_path);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  // Delete database record (cascade will delete issues and tasks)
  db.prepare('DELETE FROM documents WHERE id = ?').run(documentId);

  res.json({ message: 'Document deleted successfully' });
});

export default router;
