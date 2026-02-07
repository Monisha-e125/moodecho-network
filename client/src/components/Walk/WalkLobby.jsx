import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { walkService } from '../../services/walk';
import '../../assets/styles/walk.css';

export default function WalkLobby() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleCreateWalk = async () => {
    setCreating(true);
    setError(null);

    try {
      const result = await walkService.createWalk();
      
      if (result.data.walkCreated) {
        // Navigate to walk experience
        navigate(`/walk/${result.data.walk.id}`);
      } else {
        setError(result.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create walk');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="walk-lobby">
      <div className="walk-lobby-header">
        <h1>🌲 Mood Walks</h1>
        <p>Experience AI-generated calming journeys with mood-matched partners</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="walk-intro">
        <div className="walk-feature">
          <span className="feature-icon">🤝</span>
          <h3>Smart Matching</h3>
          <p>Paired with someone who shares similar mood patterns</p>
        </div>

        <div className="walk-feature">
          <span className="feature-icon">🎨</span>
          <h3>Unique Themes</h3>
          <p>Procedurally generated ambient experiences based on your moods</p>
        </div>

        <div className="walk-feature">
          <span className="feature-icon">⏱️</span>
          <h3>Flexible Duration</h3>
          <p>5-30 minute walks tailored to your compatibility</p>
        </div>
      </div>

      <div className="walk-actions">
        <button
          className="btn-primary btn-large"
          onClick={handleCreateWalk}
          disabled={creating}
        >
          {creating ? (
            <>
              <span className="spinner-small"></span>
              Finding Your Match...
            </>
          ) : (
            <>
              ✨ Start a Mood Walk
            </>
          )}
        </button>

        <button
          className="btn-secondary"
          onClick={() => navigate('/walk/history')}
        >
          📚 View Walk History
        </button>
      </div>

      <div className="walk-tips">
        <h3>💡 Tips for a great experience:</h3>
        <ul>
          <li>Find a quiet, comfortable place</li>
          <li>Use headphones for best audio experience</li>
          <li>Log a few moods first for better matching</li>
          <li>Stay present and enjoy the journey</li>
        </ul>
      </div>
    </div>
  );
}