import { io } from 'socket.io-client';
import { authService } from './auth';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (this.socket?.connected) return;

    const token = authService.getToken();
    
    this.socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinWalk(walkId, userId, username) {
    if (!this.socket) this.connect();
    
    this.socket.emit('join-walk', {
      walkId,
      userId,
      username
    });
  }

  leaveWalk(walkId) {
    if (this.socket) {
      this.socket.emit('leave-walk', { walkId });
    }
  }

  sendProgress(walkId, progress, currentTime) {
    if (this.socket) {
      this.socket.emit('walk-progress', {
        walkId,
        progress,
        currentTime
      });
    }
  }

  sendCheckpoint(walkId, checkpoint) {
    if (this.socket) {
      this.socket.emit('checkpoint-reached', {
        walkId,
        checkpoint
      });
    }
  }

  onWalkJoined(callback) {
    if (this.socket) {
      this.socket.on('walk-joined', callback);
    }
  }

  onUserJoined(callback) {
    if (this.socket) {
      this.socket.on('user-joined', callback);
    }
  }

  onPartnerProgress(callback) {
    if (this.socket) {
      this.socket.on('partner-progress', callback);
    }
  }

  onCheckpointUpdate(callback) {
    if (this.socket) {
      this.socket.on('checkpoint-update', callback);
    }
  }

  onPartnerCompleted(callback) {
    if (this.socket) {
      this.socket.on('partner-completed', callback);
    }
  }

  offAll() {
    if (this.socket) {
      this.socket.off();
    }
  }
}

export default new SocketService();