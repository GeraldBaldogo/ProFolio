const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');

dotenv.config();                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

const supabase = require('./src/config/db');
const initSocket = require('./src/sockets/socket');

const app = express();

const originalityRoutes = require('./src/routes/originality.routes');
const recommendationRoutes = require('./src/routes/recommendation.routes');
const cvRoutes = require('./src/routes/cv.routes');

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'https://pro-folio-development.vercel.app',
  'http://192.168.100.11:5173'
]

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'ProFolio API is running!',
    status: 'ok'
  });
});

// Routes
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

// Previously missing - built earlier in this session but never mounted
app.use('/api/chatbot', require('./src/routes/chatbot.routes'));
app.use('/api/proctoring', require('./src/routes/proctoring.routes'));

// New: student <-> professor real-time chat
app.use('/api/messages', require('./src/routes/messaging.routes'));

// New: professor-authored custom tests
app.use('/api/tests', require('./src/routes/test.routes'));

// Global error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;

  // Only log full errors for actual server problems (5xx).
  // 4xx (not found, forbidden, bad request) are expected/normal — just log briefly.
  if (status >= 500) {
    console.error('❌ ERROR:', err.message);
    console.error(err.stack);
  } else {
    console.warn(`⚠️  ${status}:`, err.message);
  }

  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

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