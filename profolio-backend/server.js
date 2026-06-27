const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const supabase = require('./src/config/db');
const app = express();

const originalityRoutes = require('./src/routes/originality.routes');
const recommendationRoutes = require('./src/routes/recommendation.routes');
const cvRoutes = require('./src/routes/cv.routes');

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'https://pro-folio-lake.vercel.app'
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

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ ERROR:', err.message);
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`ProFolio server running on port ${PORT}`);
  console.log(`Supabase connected`);
});