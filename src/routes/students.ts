import { Router, Request, Response } from 'express';
import { FileStore } from '../utils/fileStore';
import { authMiddleware, adminOnly } from '../middleware/auth';

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'student' | 'admin';
  rollNo: string | null;
  createdAt: string;
}

interface MealRegistration {
  id: string;
  userId: string;
  date: string;
  mealType: string;
  status: string;
}

interface FeedbackEntry {
  id: string;
  userId: string;
  rating: number;
}

const router = Router();
const usersStore = new FileStore<User[]>('users.json');
const mealsStore = new FileStore<MealRegistration[]>('meals.json');
const feedbackStore = new FileStore<FeedbackEntry[]>('feedback.json');

/**
 * GET /api/students
 * Admin only — list all students
 */
router.get('/', authMiddleware, adminOnly, (_req: Request, res: Response): void => {
  const users = usersStore.read();
  const students = users
    .filter(u => u.role === 'student')
    .map(({ password, ...rest }) => rest);

  res.json({ students });
});

/**
 * GET /api/stats
 * Admin only — dashboard statistics
 */
router.get('/stats', authMiddleware, adminOnly, (_req: Request, res: Response): void => {
  const users = usersStore.read();
  const meals = mealsStore.read();
  const feedbacks = feedbackStore.read();

  const today = new Date().toISOString().split('T')[0];
  const todayMeals = meals.filter(m => m.date === today && m.status === 'registered');

  const totalStudents = users.filter(u => u.role === 'student').length;
  const todayRegistrations = todayMeals.length;
  const totalFeedbacks = feedbacks.length;
  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : '0.0';

  res.json({
    stats: {
      totalStudents,
      todayRegistrations,
      totalFeedbacks,
      avgRating: parseFloat(avgRating as string)
    }
  });
});

export default router;
