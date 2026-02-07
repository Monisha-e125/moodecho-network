import React, { useState } from 'react';
import { moodService } from '../../services/mood';

export default function MoodCard({ mood, onDelete }) {
  const [showDetails, setShowDetails] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this mood entry?')) return;

    setDeleting(true);
    try {
      await moodService.deleteMood(mood._id);
      if (onDelete) onDelete();
    } catch (error) {
      alert('Failed to delete mood');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`mood-card ${showDetails ? 'expanded' : ''}`}>
      <div 
        className="mood-card-header"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="mood-card-left">
          <span className="mood-card-emoji">{mood.emoji}</span>
          <div className="mood-card-info">
            <div className="mood-card-score">
              Score: {mood.moodScore}/10
              {mood.isAnomaly && <span className="anomaly-badge">Unusual</span>}
            </div>
            <div className="mood-card-time">{formatDate(mood.timestamp)}</div>
          </div>
        </div>
        
        <div className="mood-card-right">
          <span className={`sentiment-badge ${mood.sentiment}`}>
            {mood.sentiment?.replace('_', ' ')}
          </span>
          <button className="expand-button">
            {showDetails ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="mood-card-details">
          {mood.note && (
            <div className="mood-detail-section">
              <strong>Note:</strong>
              <p>{mood.note}</p>
            </div>
          )}

          {mood.tags && mood.tags.length > 0 && (
            <div className="mood-detail-section">
              <strong>Tags:</strong>
              <div className="tag-list">
                {mood.tags.map((tag, i) => (
                  <span key={i} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {mood.context && (
            <div className="mood-detail-section">
              <strong>Context:</strong>
              <p>
                Time: {mood.context.timeOfDay || 'Not recorded'} | 
                Day: {mood.dayOfWeek}
              </p>
            </div>
          )}

          {mood.weekPattern && mood.weekPattern.length > 0 && (
            <div className="mood-detail-section">
              <strong>Pattern Insights:</strong>
              <ul>
                {mood.weekPattern.map((pattern, i) => (
                  <li key={i}>{pattern}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mood-card-actions">
            <button 
              className="btn-danger-small"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : '🗑️ Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}