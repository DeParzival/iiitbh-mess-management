import express from 'express';
import cors from 'cors';
import path from 'path';

// Route imports
import authRoutes from './routes/auth';
import menuRoutes from './routes/menu';
import feedbackRoutes from './routes/feedback';
import mealsRoutes from './routes/meals';
import announcementsRoutes from './routes/announcements';
import studentsRoutes from './routes/students';

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from /public
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── API Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/meals', mealsRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/students', studentsRoutes);

// ─── Health Check ───────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    name: 'IIIT Bhubaneswar Mess Management System',
    timestamp: new Date().toISOString()
  });
});

// ─── Fallback — serve index.html for SPA-like navigation ───
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ─── Start Server ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║   🍽️  IIIT Bhubaneswar Mess Management System   ║
  ║   Server running on http://localhost:${PORT}        ║
  ╚══════════════════════════════════════════════════╝
  `);
});

export default app;
