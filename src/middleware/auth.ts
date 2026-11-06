import { Request, Response, NextFunction } from 'express';
import { FileStore } from '../utils/fileStore';

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'student' | 'admin';
  rollNo: string | null;
  createdAt: string;
}

// Simple in-memory session store: token -> userId
const sessions: Map<string, string> = new Map();

/** Generate a simple random token */
export function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/** Store a session */
export function createSession(token: string, userId: string): void {
  sessions.set(token, userId);
}

/** Remove a session */
export function removeSession(token: string): void {
  sessions.delete(token);
}

/** Get user ID from token */
export function getUserIdFromToken(token: string): string | undefined {
  return sessions.get(token);
}

/**
 * Auth middleware — checks for Authorization header with Bearer token.
 * Attaches `req.user` if valid.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized — no token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const userId = getUserIdFromToken(token);

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized — invalid or expired token' });
    return;
  }

  const usersStore = new FileStore<User[]>('users.json');
  const users = usersStore.read();
  const user = users.find(u => u.id === userId);

  if (!user) {
    res.status(401).json({ error: 'Unauthorized — user not found' });
    return;
  }

  // Attach user to request (without password)
  (req as any).user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    rollNo: user.rollNo
  };

  next();
}

/**
 * Admin-only middleware — must be used AFTER authMiddleware.
 */
export function adminOnly(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user;

  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden — admin access required' });
    return;
  }

  next();
}
