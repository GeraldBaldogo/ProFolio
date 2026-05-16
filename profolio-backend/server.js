const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const supabase = require('./src/config/db');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
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

// Global error handler
app.use((err, req, res, next) => {
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