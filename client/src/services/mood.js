import api from './api';

export const moodService = {
  async logMood(moodData) {
    const response = await api.post('/mood', moodData);
    return response.data;
  },

  async getMoodHistory(params = {}) {
    const { days = 30, page = 1, limit = 20 } = params;
    const response = await api.get('/mood', {
      params: { days, page, limit }
    });
    return response.data;
  },

  async getMoodStats() {
    const response = await api.get('/mood/stats');
    return response.data;
  },

  async getMood(moodId) {
    const response = await api.get(`/mood/${moodId}`);
    return response.data;
  },

  async deleteMood(moodId) {
    const response = await api.delete(`/mood/${moodId}`);
    return response.data;
  }
};