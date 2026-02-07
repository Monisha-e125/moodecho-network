const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const logger = require('./utils/logger');
const { errorHandler } = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');
const { sanitizeBody, sanitizeQuery } = require('./middlewares/sanitizer');
const metrics = require('./utils/metrics');
const performanceMonitor = require('./utils/performance');
// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeBody);
app.use(sanitizeQuery);
// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}
//add after logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  metrics.trackRequest(req);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.trackResponseTime(duration);
  });
  
  next();
});
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});
app.get('/metrics', (req, res) => {
  res.json({
    status: 'success',
    data: metrics.getMetrics()
  });
});
app.get('/performance', (req, res) => {
  res.json({
    status: 'success',
    data: performanceMonitor.getReport()
  });
});
// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/mood', require('./routes/mood'));
app.use('/api/match', require('./routes/match'));
app.use('/api/walk', require('./routes/walk'));
app.use('/api/', apiLimiter);
// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;