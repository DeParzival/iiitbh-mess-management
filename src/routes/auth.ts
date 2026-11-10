import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { FileStore } from '../utils/fileStore';
import {
  generateToken,
  createSession,
  removeSession,
  authMiddleware
} from '../middleware/auth';

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'student' | 'admin';
  rollNo: string | null;
  createdAt: string;
}

const router = Router();
const usersStore = new FileStore<User[]>('users.json');

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { token, user }
 */
router.post('/login', (req: Request, res: Response): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const users = usersStore.read();
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = generateToken(user.id);
  createSession(token, user.id);

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      rollNo: user.rollNo
    }
  });
});

/**
 * POST /api/auth/register
 * Body: { name, email, password, rollNo }
 * Returns: { token, user }
 */
router.post('/register', (req: Request, res: Response): void => {
  const { name, email, password, rollNo } = req.body;

  if (!name || !email || !password || !rollNo) {
    res.status(400).json({ error: 'Name, email, password, and roll number are required' });
    return;
  }

  const users = usersStore.read();

  // Check for duplicate email
  if (users.find(u => u.email === email)) {
    res.status(409).json({ error: 'An account with this email already exists' });
    return;
  }

  // Check for duplicate roll number
  if (users.find(u => u.rollNo === rollNo)) {
    res.status(409).json({ error: 'An account with this roll number already exists' });
    return;
  }

  const newUser: User = {
    id: `stu-${uuidv4().slice(0, 8)}`,
    name,
    email,
    password,
    role: 'student',
    rollNo,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  usersStore.write(users);

  const token = generateToken(newUser.id);
  createSession(token, newUser.id);

  res.status(201).json({
    message: 'Registration successful',
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      rollNo: newUser.rollNo
    }
  });
});

/**
 * GET /api/auth/me
 * Requires: Bearer token
 * Returns: current user info
 */
router.get('/me', authMiddleware, (req: Request, res: Response): void => {
  res.json({ user: (req as any).user });
});

/**
 * POST /api/auth/logout
 * Requires: Bearer token
 */
router.post('/logout', (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    removeSession(token);
  }
  res.json({ message: 'Logged out successfully' });
});

export default router;
