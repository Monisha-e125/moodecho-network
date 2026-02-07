import { useEffect, useCallback } from 'react';
import socketService from '../services/socket';

export const useSocket = () => {
  useEffect(() => {
    socketService.connect();
    
    return () => {
      socketService.offAll();
    };
  }, []);

  const joinWalk = useCallback((walkId, userId, username) => {
    socketService.joinWalk(walkId, userId, username);
  }, []);

  const leaveWalk = useCallback((walkId) => {
    socketService.leaveWalk(walkId);
  }, []);

  const sendProgress = useCallback((walkId, progress, currentTime) => {
    socketService.sendProgress(walkId, progress, currentTime);
  }, []);

  const sendCheckpoint = useCallback((walkId, checkpoint) => {
    socketService.sendCheckpoint(walkId, checkpoint);
  }, []);

  return {
    joinWalk,
    leaveWalk,
    sendProgress,
    sendCheckpoint,
    onWalkJoined: socketService.onWalkJoined.bind(socketService),
    onUserJoined: socketService.onUserJoined.bind(socketService),
    onPartnerProgress: socketService.onPartnerProgress.bind(socketService),
    onCheckpointUpdate: socketService.onCheckpointUpdate.bind(socketService),
    onPartnerCompleted: socketService.onPartnerCompleted.bind(socketService)
  };
};