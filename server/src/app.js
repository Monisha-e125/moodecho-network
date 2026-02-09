const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const logger = require('./utils/logger');
const { errorHandler } = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');
const { sanitizeBody, sanitizeQuery } = require('./middlewares/sanitizer');
const metrics = require('./utils/metrics');
const performanceMonitor = require('./utils/performance');

const app = express();


// ✅ SECURITY
app.use(helmet());
app.use(compression());


// ✅ CORS (ONLY ONCE!)
app.use(cors({
  origin: '*', // Later you can restrict to your frontend URL
  credentials: true
}));


// ✅ BODY PARSER (ONLY ONCE)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(sanitizeBody);
app.use(sanitizeQuery);


// ✅ LOGGING
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}


// ✅ PERFORMANCE TRACKING
app.use((req, res, next) => {
  const start = Date.now();

  metrics.trackRequest(req);

  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.trackResponseTime(duration);
  });

  next();
});


// ✅ ROOT ROUTE (VERY IMPORTANT)
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'MoodEcho API is running 🚀'
  });
});


// ✅ HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});


// ✅ METRICS
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


// ✅ RATE LIMITER
app.use('/api/', apiLimiter);


// ✅ API ROUTES
app.use('/api/auth', require('./routes/auth'));
app.use('/api/mood', require('./routes/mood'));
app.use('/api/match', require('./routes/match'));
app.use('/api/walk', require('./routes/walk'));


// ✅ 404 MUST BE LAST
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.originalUrl} not found`
  });
});


// ✅ GLOBAL ERROR HANDLER (LAST LAST)
app.use(errorHandler);

module.exports = app;
