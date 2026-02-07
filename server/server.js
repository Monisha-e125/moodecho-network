const http = require('http');
const app = require('./src/app');
const { Server } = require('socket.io');
const connectDB = require('./src/config/database');
const connectRedis = require('./src/config/redis');
const logger = require('./src/utils/logger');
require('dotenv').config();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST']
  }
});

// Make io accessible to routes
app.set('io', io);

// BETTER ERROR HANDLING - Shows actual error
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error('Error name:', err.name);
  logger.error('Error message:', err.message);
  logger.error('Error stack:', err.stack);  // ← This shows WHERE the error is!
  console.error('\n=== FULL ERROR ===');
  console.error(err);
  console.error('==================\n');
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error('Error name:', err.name);
  logger.error('Error message:', err.message);
  logger.error('Error stack:', err.stack);
  console.error('\n=== FULL ERROR ===');
  console.error(err);
  console.error('==================\n');
  server.close(() => {
    process.exit(1);
  });
});

// Start server function
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    logger.info('✓ Database connected');

    // Try to connect to Redis (optional)
    try {
      await connectRedis();
      logger.info('✓ Redis connected');
    } catch (error) {
      logger.warn('⚠ Redis connection skipped (optional)');
    }

    // Initialize Socket.IO service
    const socketService = require('./src/services/socketService');
    socketService.initialize(io);
    logger.info('✓ Socket.IO service initialized');

    // Start HTTP server
    const PORT = process.env.PORT || 4000;
    server.listen(PORT, () => {
      logger.info('==================================================');
      logger.info('🚀 MoodEcho Network Server Running');
      logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`   Port: ${PORT}`);
      logger.info(`   URL: http://localhost:${PORT}`);
      logger.info(`   Health: http://localhost:${PORT}/health`);
      logger.info('==================================================');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    console.error('\n=== STARTUP ERROR ===');
    console.error(error);
    console.error('=====================\n');
    process.exit(1);
  }
};

// Start the server
startServer();