import api from './api';

export const matchService = {
  async findMatch() {
    const response = await api.get('/match');
    return response.data;
  },

  async getMyProfile() {
    const response = await api.get('/match/profile');
    return response.data;
  },

  async getCompatibility(targetUserId) {
    const response = await api.get(`/match/compatibility/${targetUserId}`);
    return response.data;
  },

  async getMatchHistory() {
    const response = await api.get('/match/history');
    return response.data;
  }
};