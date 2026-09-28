const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');

dotenv.config();

// Loaded first so a wrong SUPABASE_URL or key fails at startup, not on the
// first request.
require('./src/config/db');
const initSocket = require('./src/sockets/socket');

const app = express();

const originalityRoutes = require('./src/routes/originality.routes');
const recommendationRoutes = require('./src/routes/recommendation.routes');
const cvRoutes = require('./src/routes/cv.routes');

// ── CORS ─────────────────────────────────────────────────────────────────────
// Sites allowed to call this API. Add more without touching code by setting
// CORS_ORIGINS on Render (and in .env), comma-separated — for example a
// Vercel preview link:
//   CORS_ORIGINS=https://pro-folio-development-git-feature-x.vercel.app
const allowedOrigins = [
  'http://localhost:5173',
  'https://pro-folio-development.vercel.app',
  'http://192.168.100.11:5173',
  ...(process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
];

app.use(cors({
  origin(origin, callback) {
    // No Origin header: server-to-server calls, curl, health checks
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    // A refused site is a 403, not a crash — so it doesn't show up as a
    // ❌ 500 in the logs
    const err = new Error(`Origin not allowed by CORS: ${origin}`);
    err.status = 403;
    callback(err);
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'ProFolio API is running!',
    status: 'ok',
  });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/portfolios', require('./src/routes/portfolio.routes'));
app.use('/api/projects', require('./src/routes/project.routes'));
app.use('/api/portfolio-items', require('./src/routes/portfolio.items.routes'));
app.use('/api/evaluations', require('./src/routes/evaluation.routes'));
app.use('/api/admin', require('./src/routes/admin.routes'));
app.use('/api/student', require('./src/routes/student.routes'));
app.use('/api/assessments', require('./src/routes/assessment.routes'));

app.use('/api/originality', originalityRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/communication', require('./src/routes/communication.routes'));
app.use('/api/chatbot', require('./src/routes/chatbot.routes'));
app.use('/api/proctoring', require('./src/routes/proctoring.routes'));

// Student <-> professor real-time chat
app.use('/api/messages', require('./src/routes/messaging.routes'));

// Professor-authored custom tests
app.use('/api/tests', require('./src/routes/test.routes'));

// An /api address that doesn't exist — usually a typo in the frontend —
// gets a JSON 404 naming the address, instead of Express's HTML page.
app.use('/api', (req, res, next) => {
  next({ status: 404, message: `No such endpoint: ${req.method} ${req.originalUrl}` });
});

// Global error handler — logs the route, the user and database details
app.use(require('./src/middleware/error.middleware'));

const PORT = process.env.PORT || 5000;

// Wrap Express in a plain HTTP server so Socket.IO can attach to the same
// port - app.listen() alone can't be shared with a websocket server.
const httpServer = http.createServer(app);
const io = initSocket(httpServer);
app.set('io', io); // lets REST controllers (e.g. messaging.controller.js) emit too

httpServer.listen(PORT, () => {
  console.log(`ProFolio server running on port ${PORT}`);
  console.log(`Supabase connected`);
  console.log(`Socket.IO ready`);
});