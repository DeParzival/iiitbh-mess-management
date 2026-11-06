import { Router, Request, Response } from 'express';
import { FileStore } from '../utils/fileStore';
import { authMiddleware, adminOnly } from '../middleware/auth';

interface MealSlot {
  items: string[];
  time: string;
}

interface DayMenu {
  breakfast: MealSlot;
  lunch: MealSlot;
  snacks: MealSlot;
  dinner: MealSlot;
}

type WeeklyMenu = Record<string, DayMenu>;

const router = Router();
const menuStore = new FileStore<WeeklyMenu>('menu.json');

// Map day index (0=Sun) to day name
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * GET /api/menu
 * Returns the full weekly menu
 */
router.get('/', (_req: Request, res: Response): void => {
  const menu = menuStore.read();
  res.json({ menu });
});

/**
 * GET /api/menu/today
 * Returns today's menu
 */
router.get('/today', (_req: Request, res: Response): void => {
  const menu = menuStore.read();
  const today = dayNames[new Date().getDay()];
  const todayMenu = menu[today];

  if (!todayMenu) {
    res.status(404).json({ error: 'Menu not found for today' });
    return;
  }

  res.json({ day: today, menu: todayMenu });
});

/**
 * PUT /api/menu/:day
 * Admin only — update menu for a specific day
 * Body: { breakfast?, lunch?, snacks?, dinner? }
 */
router.put('/:day', authMiddleware, adminOnly, (req: Request, res: Response): void => {
  const { day } = req.params;

  if (!dayNames.includes(day)) {
    res.status(400).json({ error: `Invalid day. Use one of: ${dayNames.join(', ')}` });
    return;
  }

  const menu = menuStore.read();
  const updates = req.body;

  // Merge updates into existing day menu
  menu[day] = {
    ...menu[day],
    ...updates
  };

  menuStore.write(menu);
  res.json({ message: `Menu updated for ${day}`, menu: menu[day] });
});

export default router;
