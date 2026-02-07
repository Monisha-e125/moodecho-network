import api from './api';

export const walkService = {
  async createWalk() {
    const response = await api.post('/walk');
    return response.data;
  },

  async getWalk(walkId) {
    const response = await api.get(`/walk/${walkId}`);
    return response.data;
  },

  async startWalk(walkId) {
    const response = await api.patch(`/walk/${walkId}/start`);
    return response.data;
  },

  async completeWalk(walkId, feedback) {
    const response = await api.patch(`/walk/${walkId}/complete`, feedback);
    return response.data;
  },

  async getWalkHistory(params = {}) {
    const response = await api.get('/walk/history', { params });
    return response.data;
  },

  async getRecommendations() {
    const response = await api.get('/walk/recommendations');
    return response.data;
  },

  async abandonWalk(walkId) {
    const response = await api.delete(`/walk/${walkId}`);
    return response.data;
  }
};