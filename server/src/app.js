const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const createRateLimiter = require('./middleware/rateLimiter');

// Route imports
const authRoutes = require('./routes/authRoutes');
const searchRoutes = require('./routes/searchRoutes');
const paperRoutes = require('./routes/paperRoutes');
const citationRoutes = require('./routes/citationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const fileRoutes = require('./routes/fileRoutes');

const createApp = (env) => {
  const app = express();

  // ── Security & Parsing ──────────────────────────────────
  app.use(helmet());
  app.use(cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(morgan('dev'));

  // ── Rate Limiting ───────────────────────────────────────
  app.use('/api/', createRateLimiter(env.RATE_LIMIT_WINDOW_MS, env.RATE_LIMIT_MAX_REQUESTS));

  // ── Health Check ────────────────────────────────────────
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── Routes ──────────────────────────────────────────────
  app.use('/api/auth', authRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/papers', paperRoutes);
  app.use('/api/citations', citationRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/files', fileRoutes);

  // ── 404 ─────────────────────────────────────────────────
  app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
  });

  // ── Error Handler ───────────────────────────────────────
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
