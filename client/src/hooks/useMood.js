import { useState, useCallback } from 'react';
import { moodService } from '../services/mood';

export const useMood = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const logMood = useCallback(async (moodData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await moodService.logMood(moodData);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log mood');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMoodHistory = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await moodService.getMoodHistory(params);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch mood history');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMoodStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await moodService.getMoodStats();
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch mood stats');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    logMood,
    getMoodHistory,
    getMoodStats
  };
};