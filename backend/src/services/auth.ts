import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database/schema.js';
import type { User } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hr-compliance-secret-key-change-in-production';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: number, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: number; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
  } catch {
    return null;
  }
}

export function createUser(email: string, password: string, name: string): User {
  const hashedPassword = bcrypt.hashSync(password, 10);
  const stmt = db.prepare(
    'INSERT INTO users (email, password, name) VALUES (?, ?, ?)'
  );
  const result = stmt.run(email, hashedPassword, name);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as User;
  return user;
}

export function getUserByEmail(email: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
}

export function getUserById(id: number): User | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
}

export function getAllUsers(): User[] {
  return db.prepare('SELECT id, email, name, role, created_at FROM users').all() as User[];
}
