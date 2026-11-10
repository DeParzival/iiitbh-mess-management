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

/**
 * Token format: base64(userId).randomString
 * This makes tokens self-contained — no server-side session storage needed.
 * Works perfectly with Vercel's stateless serverless functions.
 */

/** Generate a self-contained token that encodes the userId */
export function generateToken(userId: string): string {
  const encoded = Buffer.from(userId).toString('base64');
  const random = Math.random().toString(36).substring(2) + Date.now().toString(36);
  return `${encoded}.${random}`;
}

/** Extract user ID from a self-contained token */
export function getUserIdFromToken(token: string): string | undefined {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return undefined;
    const userId = Buffer.from(parts[0], 'base64').toString('utf-8');
    return userId || undefined;
  } catch {
    return undefined;
  }
}

/** createSession / removeSession kept as no-ops for API compatibility */
export function createSession(_token: string, _userId: string): void {
  // No-op — tokens are self-contained
}

export function removeSession(_token: string): void {
  // No-op — stateless auth
}

/**
 * Auth middleware — checks for Authorization header with Bearer token.
 * Decodes the userId from the token itself (stateless).
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
