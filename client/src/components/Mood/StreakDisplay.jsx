import React, { useEffect, useState } from 'react';
import './streak.css';

export default function StreakDisplay({ userId, refreshKey }) {
  const [streak, setStreak] = useState(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreak();
  }, [userId, refreshKey]); // Reload when refreshKey changes

  const loadStreak = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/streak/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load streak');
      }
      
      const data = await response.json();
      setStreak(data.data);
      
    } catch (error) {
      console.error('Failed to load streak:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="streak-display">
        <div className="streak-loading">Loading streak...</div>
      </div>
    );
  }
  
  if (!streak) return null;

  const getStreakEmoji = (days) => {
    if (days >= 100) return '🏆';
    if (days >= 30) return '👑';
    if (days >= 14) return '💪';
    if (days >= 7) return '⚡';
    if (days >= 3) return '🔥';
    if (days >= 1) return '📝';
    return '💤';
  };

  const getStreakMessage = (days) => {
    if (days === 0) return "Start your streak today!";
    if (days === 1) return "Great start! Come back tomorrow!";
    if (days < 7) return "You're building momentum!";
    if (days < 30) return "Incredible dedication!";
    if (days < 100) return "You're unstoppable!";
    return "Legendary streak!";
  };

  return (
    <div className="streak-display">
      <div className="streak-main">
        <div className="streak-icon">
          {getStreakEmoji(streak.current)}
        </div>
        <div className="streak-info">
          <div className="streak-number">{streak.current}</div>
          <div className="streak-label">Day Streak</div>
          <div className="streak-message">{getStreakMessage(streak.current)}</div>
        </div>
      </div>

      <div className="streak-stats">
        <div className="stat">
          <span className="stat-value">{streak.longest}</span>
          <span className="stat-label">Longest Streak</span>
        </div>
        <div className="stat">
          <span className="stat-value">{streak.achievements?.length || 0}</span>
          <span className="stat-label">Achievements</span>
        </div>
      </div>

      {streak.achievements && streak.achievements.length > 0 && (
        <>
          <button 
            className="view-achievements-btn"
            onClick={() => setShowAchievements(!showAchievements)}
          >
            {showAchievements ? '▼ Hide' : '▶ View'} Achievements
          </button>

          {showAchievements && (
            <div className="achievements-list">
              {streak.achievements.map((achievement, i) => (
                <div key={i} className="achievement-item">
                  <span className="achievement-icon">
                    {getAchievementIcon(achievement.type)}
                  </span>
                  <div className="achievement-details">
                    <strong>{achievement.title || getAchievementTitle(achievement.type)}</strong>
                    <small>
                      Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {streak.current === 0 && (
        <div className="streak-tip">
          💡 Log a mood today to start your streak!
        </div>
      )}
    </div>
  );
}

function getAchievementIcon(type) {
  const icons = {
    'starter': '🔥',
    'week-warrior': '⚡',
    'two-weeker': '💪',
    'month-master': '👑',
    'fifty-fighter': '🌟',
    'century-legend': '🏆',
    'year-champion': '🎉'
  };
  return icons[type] || '🏅';
}

function getAchievementTitle(type) {
  const titles = {
    'starter': '3-Day Streak',
    'week-warrior': 'Week Warrior',
    'two-weeker': 'Two-Week Champion',
    'month-master': 'Month Master',
    'fifty-fighter': 'Fifty Fighter',
    'century-legend': 'Century Legend',
    'year-champion': 'Year Champion'
  };
  return titles[type] || 'Achievement';
}