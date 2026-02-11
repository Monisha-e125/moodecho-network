import React, { useEffect, useState } from 'react';
import './streak.css';

export default function StreakDisplay({ userId }) {
    const [streak, setStreak] = useState(null);
    const [showAchievements, setShowAchievements] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStreak();
    }, [userId]);

    const loadStreak = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found');
                return;
            }

            const response = await fetch('/api/streak/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok && data.data) {
                setStreak(data.data);
            } else {
                console.error('Failed to load streak:', data);
                // Fallback to empty state to ensure visibility
                setStreak({
                    current: 0,
                    longest: 0,
                    achievements: []
                });
            }
        } catch (error) {
            console.error('Network error loading streak:', error);
            setStreak({
                current: 0,
                longest: 0,
                achievements: []
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading streak...</div>;
    if (!streak) return null;

    const getStreakEmoji = (days) => {
        if (days >= 100) return '🏆';
        if (days >= 30) return '👑';
        if (days >= 14) return '💪';
        if (days >= 7) return '⚡';
        if (days >= 3) return '🔥';
        return '📝';
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
                </div>
            </div>

            <div className="streak-stats">
                <div className="stat">
                    <span className="stat-value">{streak.longest}</span>
                    <span className="stat-label">Longest</span>
                </div>
                <div className="stat">
                    <span className="stat-value">{streak.achievements?.length || 0}</span>
                    <span className="stat-label">Achievements</span>
                </div>
            </div>

            {streak.achievements && streak.achievements.length > 0 && (
                <button
                    className="view-achievements-btn"
                    onClick={() => setShowAchievements(!showAchievements)}
                >
                    {showAchievements ? 'Hide' : 'View'} Achievements
                </button>
            )}

            {showAchievements && (
                <div className="achievements-list">
                    {streak.achievements.map((achievement, i) => (
                        <div key={i} className="achievement-item">
                            <span className="achievement-icon">
                                {getAchievementIcon(achievement.type)}
                            </span>
                            <div className="achievement-details">
                                <strong>{getAchievementTitle(achievement.type)}</strong>
                                <small>
                                    {new Date(achievement.unlockedAt).toLocaleDateString()}
                                </small>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function getAchievementIcon(type) {
    const icons = {
        'starter': '🔥',
        'week-warrior': '⚡',
        'two-week-champ': '💪',
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
        'two-week-champ': 'Two-Week Champion',
        'month-master': 'Month Master',
        'fifty-fighter': 'Fifty Fighter',
        'century-legend': 'Century Legend',
        'year-champion': 'Year Champion'
    };
    return titles[type] || 'Achievement';
}