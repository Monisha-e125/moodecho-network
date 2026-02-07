import React, { useState, useEffect } from 'react';
import { useMood } from '../../hooks/useMood';
import '../../assets/styles/mood.css';

export default function MoodStats() {
  const [stats, setStats] = useState(null);
  const { loading, getMoodStats } = useMood();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const result = await getMoodStats();
      setStats(result.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading statistics...</p>
      </div>
    );
  }

  if (!stats || !stats.stats) {
    return (
      <div className="empty-state">
        <p>No statistics available yet</p>
      </div>
    );
  }

  return (
    <div className="mood-stats">
      <h2>📊 Your Mood Statistics</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{stats.stats.totalEntries || 0}</div>
          <div className="stat-label">Total Entries</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-value">{stats.stats.avgMood || 0}</div>
          <div className="stat-label">Average Mood</div>
        </div>

        {stats.stats.emojiDistribution && (
          <div className="stat-card wide">
            <h3>Most Used Moods</h3>
            <div className="emoji-distribution">
              {Object.entries(stats.stats.emojiDistribution)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([emoji, count]) => (
                  <div key={emoji} className="emoji-stat">
                    <span className="emoji-large">{emoji}</span>
                    <span className="emoji-count">{count}x</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {stats.weekPattern && stats.weekPattern.length > 0 && (
        <div className="stat-section">
          <h3>📅 Weekly Patterns</h3>
          <div className="pattern-list">
            {stats.weekPattern.map((pattern, i) => (
              <div key={i} className="pattern-item">
                <span className="pattern-icon">💡</span>
                <p>{pattern}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.prediction && (
        <div className="stat-section">
          <h3>🔮 Mood Trend</h3>
          <div className={`trend-card trend-${stats.prediction.trend}`}>
            <div className="trend-header">
              <span className="trend-emoji">
                {stats.prediction.trend === 'improving' ? '📈' : 
                 stats.prediction.trend === 'declining' ? '📉' : '➡️'}
              </span>
              <span className="trend-label">
                {stats.prediction.trend.toUpperCase()}
              </span>
            </div>
            <p className="trend-message">{stats.prediction.message}</p>
          </div>
        </div>
      )}

      {stats.insights && stats.insights.insights && (
        <div className="stat-section">
          <h3>✨ Insights</h3>
          <div className="insights-list">
            {stats.insights.insights.map((insight, i) => (
              <div key={i} className="insight-item">
                <span className="insight-icon">💭</span>
                <p>{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}