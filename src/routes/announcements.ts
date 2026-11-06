import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { FileStore } from '../utils/fileStore';
import { authMiddleware, adminOnly } from '../middleware/auth';

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'high' | 'normal' | 'low';
  createdAt: string;
  createdBy: string;
}

const router = Router();
const announcementsStore = new FileStore<Announcement[]>('announcements.json');

/**
 * GET /api/announcements
 * Get all announcements (public)
 */
router.get('/', (_req: Request, res: Response): void => {
  const announcements = announcementsStore.read();
  // Return sorted by date, newest first
  const sorted = announcements.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({ announcements: sorted });
});

/**
 * POST /api/announcements
 * Admin only — create announcement
 * Body: { title, message, priority? }
 */
router.post('/', authMiddleware, adminOnly, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const { title, message, priority } = req.body;

  if (!title || !message) {
    res.status(400).json({ error: 'Title and message are required' });
    return;
  }

  const announcements = announcementsStore.read();

  const newAnnouncement: Announcement = {
    id: `ann-${uuidv4().slice(0, 8)}`,
    title,
    message,
    priority: priority || 'normal',
    createdAt: new Date().toISOString(),
    createdBy: user.id
  };

  announcements.push(newAnnouncement);
  announcementsStore.write(announcements);

  res.status(201).json({ message: 'Announcement created', announcement: newAnnouncement });
});

/**
 * DELETE /api/announcements/:id
 * Admin only — delete an announcement
 */
router.delete('/:id', authMiddleware, adminOnly, (req: Request, res: Response): void => {
  const { id } = req.params;
  const announcements = announcementsStore.read();
  const filtered = announcements.filter(a => a.id !== id);

  if (filtered.length === announcements.length) {
    res.status(404).json({ error: 'Announcement not found' });
    return;
  }

  announcementsStore.write(filtered);
  res.json({ message: 'Announcement deleted' });
});

export default router;
