import React, { useState, useEffect } from 'react';
import { useMood } from '../../hooks/useMood';
import MoodCard from './MoodCard';
import '../../assets/styles/mood.css';

export default function MoodHistory() {
  const [moods, setMoods] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [days, setDays] = useState(7);
  const [page, setPage] = useState(1);
  
  const { loading, getMoodHistory } = useMood();

  useEffect(() => {
    loadMoods();
  }, [days, page]);

  const loadMoods = async () => {
    try {
      const result = await getMoodHistory({ days, page, limit: 10 });
      setMoods(result.data.moods);
      setPagination(result.data.pagination);
    } catch (error) {
      console.error('Failed to load moods:', error);
    }
  };

  const handleDaysChange = (newDays) => {
    setDays(newDays);
    setPage(1);
  };

  return (
    <div className="mood-history">
      <div className="mood-history-header">
        <h2>📚 Mood History</h2>
        
        <div className="filter-buttons">
          <button 
            className={days === 7 ? 'active' : ''}
            onClick={() => handleDaysChange(7)}
          >
            7 Days
          </button>
          <button 
            className={days === 30 ? 'active' : ''}
            onClick={() => handleDaysChange(30)}
          >
            30 Days
          </button>
          <button 
            className={days === 90 ? 'active' : ''}
            onClick={() => handleDaysChange(90)}
          >
            90 Days
          </button>
        </div>
      </div>

      {loading && page === 1 ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading moods...</p>
        </div>
      ) : moods.length === 0 ? (
        <div className="empty-state">
          <span className="empty-emoji">😊</span>
          <h3>No moods logged yet</h3>
          <p>Start logging your moods to see your history</p>
        </div>
      ) : (
        <>
          <div className="mood-list">
            {moods.map((mood) => (
              <MoodCard 
                key={mood._id} 
                mood={mood}
                onDelete={loadMoods}
              />
            ))}
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                ← Previous
              </button>
              
              <span>
                Page {pagination.page} of {pagination.pages}
              </span>
              
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === pagination.pages || loading}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}