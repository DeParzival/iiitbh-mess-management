import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { FileStore } from '../utils/fileStore';
import { authMiddleware, adminOnly } from '../middleware/auth';

interface FeedbackEntry {
  id: string;
  userId: string;
  userName: string;
  mealType: 'breakfast' | 'lunch' | 'snacks' | 'dinner';
  rating: number;
  comment: string;
  date: string;
  createdAt: string;
}

const router = Router();
const feedbackStore = new FileStore<FeedbackEntry[]>('feedback.json');

/**
 * POST /api/feedback
 * Submit feedback (student only)
 * Body: { mealType, rating, comment, date? }
 */
router.post('/', authMiddleware, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const { mealType, rating, comment, date } = req.body;

  if (!mealType || rating === undefined || !comment) {
    res.status(400).json({ error: 'mealType, rating, and comment are required' });
    return;
  }

  if (rating < 1 || rating > 5) {
    res.status(400).json({ error: 'Rating must be between 1 and 5' });
    return;
  }

  const validMeals = ['breakfast', 'lunch', 'snacks', 'dinner'];
  if (!validMeals.includes(mealType)) {
    res.status(400).json({ error: `mealType must be one of: ${validMeals.join(', ')}` });
    return;
  }

  const feedbacks = feedbackStore.read();

  const newFeedback: FeedbackEntry = {
    id: `fb-${uuidv4().slice(0, 8)}`,
    userId: user.id,
    userName: user.name,
    mealType,
    rating,
    comment,
    date: date || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  };

  feedbacks.push(newFeedback);
  feedbackStore.write(feedbacks);

  res.status(201).json({ message: 'Feedback submitted successfully', feedback: newFeedback });
});

/**
 * GET /api/feedback/my
 * Get current user's feedback history
 */
router.get('/my', authMiddleware, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const feedbacks = feedbackStore.read();
  const myFeedbacks = feedbacks.filter(f => f.userId === user.id);

  res.json({ feedbacks: myFeedbacks });
});

/**
 * GET /api/feedback
 * Admin: get all feedback. Student: get own feedback.
 */
router.get('/', authMiddleware, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const feedbacks = feedbackStore.read();

  if (user.role === 'admin') {
    res.json({ feedbacks });
  } else {
    res.json({ feedbacks: feedbacks.filter(f => f.userId === user.id) });
  }
});

export default router;
