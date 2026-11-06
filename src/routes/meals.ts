import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { FileStore } from '../utils/fileStore';
import { authMiddleware } from '../middleware/auth';

interface MealRegistration {
  id: string;
  userId: string;
  userName: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'snacks' | 'dinner';
  status: 'registered' | 'skipped';
  createdAt: string;
}

const router = Router();
const mealsStore = new FileStore<MealRegistration[]>('meals.json');

/**
 * POST /api/meals/register
 * Register or skip a meal
 * Body: { date, mealType, status }
 */
router.post('/register', authMiddleware, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const { date, mealType, status } = req.body;

  if (!date || !mealType || !status) {
    res.status(400).json({ error: 'date, mealType, and status are required' });
    return;
  }

  const validMeals = ['breakfast', 'lunch', 'snacks', 'dinner'];
  if (!validMeals.includes(mealType)) {
    res.status(400).json({ error: `mealType must be one of: ${validMeals.join(', ')}` });
    return;
  }

  if (!['registered', 'skipped'].includes(status)) {
    res.status(400).json({ error: 'status must be "registered" or "skipped"' });
    return;
  }

  const meals = mealsStore.read();

  // Check if already registered for this meal on this date
  const existingIndex = meals.findIndex(
    m => m.userId === user.id && m.date === date && m.mealType === mealType
  );

  if (existingIndex >= 0) {
    // Update existing registration
    meals[existingIndex].status = status;
    mealsStore.write(meals);
    res.json({ message: 'Meal registration updated', registration: meals[existingIndex] });
    return;
  }

  const newReg: MealRegistration = {
    id: `meal-${uuidv4().slice(0, 8)}`,
    userId: user.id,
    userName: user.name,
    date,
    mealType,
    status,
    createdAt: new Date().toISOString()
  };

  meals.push(newReg);
  mealsStore.write(meals);

  res.status(201).json({ message: 'Meal registration created', registration: newReg });
});

/**
 * GET /api/meals/my
 * Get current user's meal registrations
 */
router.get('/my', authMiddleware, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const meals = mealsStore.read();
  const myMeals = meals.filter(m => m.userId === user.id);

  res.json({ registrations: myMeals });
});

/**
 * GET /api/meals
 * Admin: all registrations. Student: own registrations.
 */
router.get('/', authMiddleware, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const meals = mealsStore.read();

  if (user.role === 'admin') {
    res.json({ registrations: meals });
  } else {
    res.json({ registrations: meals.filter(m => m.userId === user.id) });
  }
});

export default router;
