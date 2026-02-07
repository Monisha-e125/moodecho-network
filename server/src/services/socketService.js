const MoodWalk = require('../models/MoodWalk');
const logger = require('../utils/logger');

class SocketService {
  constructor() {
    this.io = null;
    this.activeWalks = new Map();
  }

  initialize(io) {
    this.io = io;
    
    io.on('connection', (socket) => {
      logger.info(`Socket connected: ${socket.id}`);

      socket.on('join-walk', async (data) => {
        await this.handleJoinWalk(socket, data);
      });

      socket.on('walk-progress', (data) => {
        this.handleWalkProgress(socket, data);
      });

      socket.on('checkpoint-reached', (data) => {
        this.handleCheckpointReached(socket, data);
      });

      socket.on('complete-walk', async (data) => {
        await this.handleCompleteWalk(socket, data);
      });

      socket.on('typing', (data) => {
        this.handleTyping(socket, data);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });

    logger.info('Socket.IO service initialized');
  }

  async handleJoinWalk(socket, data) {
    try {
      const { walkId, userId, username } = data;
      
      if (!walkId || !userId) {
        socket.emit('error', { message: 'Invalid walk data' });
        return;
      }

      const walk = await MoodWalk.findById(walkId);
      if (!walk) {
        socket.emit('error', { message: 'Walk not found' });
        return;
      }

      const isParticipant = walk.participants.some(
        p => p.userId.toString() === userId
      );

      if (!isParticipant) {
        socket.emit('error', { message: 'Not authorized for this walk' });
        return;
      }

      socket.join(`walk-${walkId}`);
      socket.walkId = walkId;
      socket.userId = userId;
      socket.username = username;

      if (!this.activeWalks.has(walkId)) {
        this.activeWalks.set(walkId, new Set());
      }
      this.activeWalks.get(walkId).add(socket.id);

      socket.to(`walk-${walkId}`).emit('user-joined', {
        userId,
        username,
        timestamp: new Date()
      });

      socket.emit('walk-joined', {
        walkId,
        participants: Array.from(this.activeWalks.get(walkId)).length,
        walk: {
          theme: walk.theme,
          duration: walk.duration,
          status: walk.status
        }
      });

      logger.info(`User ${username} joined walk ${walkId}`);

    } catch (error) {
      logger.error('Error in handleJoinWalk:', error);
      socket.emit('error', { message: 'Failed to join walk' });
    }
  }

  handleWalkProgress(socket, data) {
    const { walkId, progress, currentTime } = data;
    
    if (!walkId || progress === undefined) return;

    socket.to(`walk-${walkId}`).emit('partner-progress', {
      userId: socket.userId,
      username: socket.username,
      progress,
      currentTime,
      timestamp: new Date()
    });
  }

  handleCheckpointReached(socket, data) {
    const { walkId, checkpoint } = data;
    
    if (!walkId || !checkpoint) return;

    this.io.to(`walk-${walkId}`).emit('checkpoint-update', {
      userId: socket.userId,
      username: socket.username,
      checkpoint,
      timestamp: new Date()
    });

    logger.info(`User ${socket.username} reached checkpoint ${checkpoint} in walk ${walkId}`);
  }

  async handleCompleteWalk(socket, data) {
    try {
      const { walkId, rating, feedback } = data;

      if (!walkId) return;

      socket.to(`walk-${walkId}`).emit('partner-completed', {
        userId: socket.userId,
        username: socket.username,
        rating,
        timestamp: new Date()
      });

      logger.info(`User ${socket.username} completed walk ${walkId}`);

    } catch (error) {
      logger.error('Error in handleCompleteWalk:', error);
    }
  }

  handleTyping(socket, data) {
    const { walkId, isTyping } = data;
    
    if (!walkId) return;

    socket.to(`walk-${walkId}`).emit('partner-typing', {
      userId: socket.userId,
      username: socket.username,
      isTyping
    });
  }

  handleDisconnect(socket) {
    logger.info(`Socket disconnected: ${socket.id}`);

    if (socket.walkId) {
      const walkSockets = this.activeWalks.get(socket.walkId);
      if (walkSockets) {
        walkSockets.delete(socket.id);
        
        if (walkSockets.size === 0) {
          this.activeWalks.delete(socket.walkId);
        }
      }

      socket.to(`walk-${socket.walkId}`).emit('user-left', {
        userId: socket.userId,
        username: socket.username,
        timestamp: new Date()
      });
    }
  }

  broadcastToWalk(walkId, event, data) {
    if (this.io) {
      this.io.to(`walk-${walkId}`).emit(event, data);
    }
  }

  getActiveParticipants(walkId) {
    const sockets = this.activeWalks.get(walkId);
    return sockets ? sockets.size : 0;
  }
}

module.exports = new SocketService();