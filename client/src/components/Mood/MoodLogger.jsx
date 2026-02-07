import React, { useState } from 'react';
import { useMood } from '../../hooks/useMood';
import '../../assets/styles/mood.css';

const MOODS = [
  { emoji: '😢', label: 'Sad', score: 2 },
  { emoji: '😔', label: 'Down', score: 4 },
  { emoji: '😐', label: 'Okay', score: 5 },
  { emoji: '😊', label: 'Happy', score: 7 },
  { emoji: '😄', label: 'Great', score: 9 },
  { emoji: '😤', label: 'Angry', score: 3 },
  { emoji: '😰', label: 'Anxious', score: 3 },
  { emoji: '😌', label: 'Calm', score: 8 },
  { emoji: '🥰', label: 'Loved', score: 10 }
];

export default function MoodLogger({ onMoodLogged }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState('');
  const [tags, setTags] = useState('');
  const [analysis, setAnalysis] = useState(null);
  
  const { loading, error, logMood } = useMood();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedMood) {
      alert('Please select a mood');
      return;
    }

    try {
      const result = await logMood({
        emoji: selectedMood.emoji,
        moodScore: selectedMood.score,
        note: note.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean)
      });

      setAnalysis(result.data.analysis);
      setSelectedMood(null);
      setNote('');
      setTags('');

      if (onMoodLogged) {
        onMoodLogged(result.data.mood);
      }

      setTimeout(() => setAnalysis(null), 10000);
    } catch (err) {
      console.error('Failed to log mood:', err);
    }
  };

  return (
    <div className="mood-logger">
      <div className="mood-logger-header">
        <h2>How are you feeling?</h2>
        <p>Select your current mood and add a note if you'd like</p>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {analysis && (
        <div className="mood-analysis">
          <h3>✨ AI Analysis</h3>
          <div className="analysis-content">
            <div className="analysis-item">
              <strong>Sentiment:</strong>
              <span className={`sentiment ${analysis.sentiment?.type}`}>
                {analysis.sentiment?.type}
              </span>
            </div>
            
            {analysis.weekPattern && analysis.weekPattern.length > 0 && (
              <div className="analysis-item">
                <strong>Pattern:</strong>
                <p>{analysis.weekPattern[0]}</p>
              </div>
            )}
            
            {analysis.prediction && (
              <div className="analysis-item">
                <strong>Trend:</strong>
                <p>{analysis.prediction.message}</p>
              </div>
            )}

            {analysis.isAnomaly && (
              <div className="analysis-item anomaly">
                <strong>⚠️ Unusual Entry:</strong>
                <p>This mood is significantly different from your usual pattern</p>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mood-form">
        <div className="mood-grid">
          {MOODS.map((mood) => (
            <button
              key={mood.emoji}
              type="button"
              className={`mood-button ${selectedMood?.emoji === mood.emoji ? 'selected' : ''}`}
              onClick={() => setSelectedMood(mood)}
            >
              <span className="mood-emoji">{mood.emoji}</span>
              <span className="mood-label">{mood.label}</span>
              <span className="mood-score">{mood.score}/10</span>
            </button>
          ))}
        </div>

        <div className="form-group">
          <label>What's on your mind? (Optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Share your thoughts, feelings, or what happened today..."
            maxLength={500}
            rows={4}
          />
          <small>{note.length}/500 characters</small>
        </div>

        <div className="form-group">
          <label>Tags (Optional)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="work, family, health (comma separated)"
          />
        </div>

        <button 
          type="submit" 
          className="btn-primary btn-large"
          disabled={!selectedMood || loading}
        >
          {loading ? (
            <>
              <span className="spinner-small"></span>
              Logging Mood...
            </>
          ) : (
            'Log Mood 📝'
          )}
        </button>
      </form>
    </div>
  );
}