const http = require('http');
const app = require('./src/app');
const { Server } = require('socket.io');
const connectDB = require('./src/config/database');
const connectRedis = require('./src/config/redis');
const logger = require('./src/utils/logger');
require('dotenv').config();
const cors = require("cors");
// Create HTTP server (IMPORTANT for Render + Socket.IO)
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : '*',
    methods: ['GET', 'POST']
  }
});

// Make io accessible
app.set('io', io);


// ================= ERROR HANDLING ================= //

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err.stack);

  server.close(() => {
    process.exit(1);
  });
});


// ================= START SERVER ================= //

const startServer = async () => {
  try {

    // ✅ Connect MongoDB
    await connectDB();
    logger.info('✅ Database connected');

    // ✅ Redis (OPTIONAL — skip if not configured)
    try {
      if (process.env.REDIS_URL) {
        await connectRedis();
        logger.info('✅ Redis connected');
      } else {
        logger.warn('⚠ Redis not configured — skipping');
      }
    } catch (error) {
      logger.warn('⚠ Redis connection failed — skipping');
    }

    // ✅ Initialize Socket Service
    const socketService = require('./src/services/socketService');
    socketService.initialize(io);

    // ⭐ VERY IMPORTANT FOR RENDER
    const PORT = process.env.PORT || 4000;

    server.listen(PORT, () => {
      logger.info('==================================================');
      logger.info('🚀 MoodEcho Network Server Running');
      logger.info(`Environment : ${process.env.NODE_ENV || 'production'}`);
      logger.info(`Port        : ${PORT}`);
      logger.info('==================================================');
    });

  } catch (error) {
    logger.error('❌ Failed to start server');
    logger.error(error.stack);
    process.exit(1);
  }
};
app.use(cors({
    origin: "*"
}));

// START
startServer();
