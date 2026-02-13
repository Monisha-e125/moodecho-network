import React, { useState } from 'react';
import { useMood } from '../../hooks/useMood';
import '../../assets/styles/mood.css';

const MOODS = [
  // === HAPPY FAMILY ===
  { emoji: '😊', label: 'Happy', score: 7, category: 'positive' },
  { emoji: '😄', label: 'Excited', score: 9, category: 'positive' },
  { emoji: '🥰', label: 'Loved', score: 9, category: 'positive' },
  { emoji: '😎', label: 'Cool', score: 8, category: 'positive' },
  { emoji: '🤗', label: 'Grateful', score: 8, category: 'positive' },
  { emoji: '😌', label: 'Peaceful', score: 8, category: 'positive' },
  { emoji: '🤩', label: 'Amazed', score: 9, category: 'positive' },
  { emoji: '🥳', label: 'Celebrating', score: 10, category: 'positive' },

  // === NEUTRAL FAMILY ===
  { emoji: '😐', label: 'Meh', score: 5, category: 'neutral' },
  { emoji: '🤔', label: 'Thoughtful', score: 5, category: 'neutral' },
  { emoji: '😑', label: 'Tired', score: 4, category: 'neutral' },
  { emoji: '🙄', label: 'Annoyed', score: 4, category: 'neutral' },
  { emoji: '😴', label: 'Sleepy', score: 4, category: 'neutral' },
  { emoji: '🥱', label: 'Bored', score: 4, category: 'neutral' },

  // === SAD FAMILY ===
  { emoji: '😔', label: 'Down', score: 3, category: 'negative' },
  { emoji: '😢', label: 'Sad', score: 2, category: 'negative' },
  { emoji: '😭', label: 'Crying', score: 1, category: 'negative' },
  { emoji: '😞', label: 'Disappointed', score: 3, category: 'negative' },
  { emoji: '🥺', label: 'Hurt', score: 2, category: 'negative' },

  // === ANXIOUS FAMILY ===
  { emoji: '😰', label: 'Anxious', score: 3, category: 'negative' },
  { emoji: '😨', label: 'Scared', score: 2, category: 'negative' },
  { emoji: '😟', label: 'Worried', score: 3, category: 'negative' },
  { emoji: '😖', label: 'Stressed', score: 3, category: 'negative' },

  // === ANGRY FAMILY ===
  { emoji: '😤', label: 'Frustrated', score: 3, category: 'negative' },
  { emoji: '😠', label: 'Angry', score: 2, category: 'negative' },
  { emoji: '🤬', label: 'Furious', score: 1, category: 'negative' },

  // === ENERGY FAMILY ===
  { emoji: '💪', label: 'Motivated', score: 8, category: 'positive' },
  { emoji: '🔥', label: 'Pumped', score: 9, category: 'positive' },
  { emoji: '⚡', label: 'Energized', score: 8, category: 'positive' },

  // === SOCIAL FAMILY ===
  { emoji: '🤝', label: 'Friendly', score: 7, category: 'positive' },
  { emoji: '😍', label: 'In Love', score: 10, category: 'positive' },
];

export default function MoodLogger({ onMoodLogged }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('all');
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
      if (result.data.streak) {
      console.log('Streak updated:', result.data.streak);
      
      // Show achievement notification if any
      if (result.data.streak.newAchievements && 
          result.data.streak.newAchievements.length > 0) {
        
        const achievement = result.data.streak.newAchievements[0];
        alert(`🎉 Achievement Unlocked!\n\n${achievement.title}\n${achievement.description}`);
      }
      
      // Trigger streak display refresh
      if (onStreakUpdate) {
        onStreakUpdate(result.data.streak);
      }
    }

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

  // Filter moods by category
  const filteredMoods = category === 'all'
    ? MOODS
    : MOODS.filter(m => m.category === category);

  return (
    <div className="mood-logger">
      <div className="mood-logger-header">
        <h2>How are you feeling?</h2>

        {/* Category filters */}
        <div className="category-filters">
          <button
            className={`filter-btn ${category === 'all' ? 'active' : ''}`}
            onClick={() => setCategory('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${category === 'positive' ? 'active' : ''}`}
            onClick={() => setCategory('positive')}
          >
            😊 Happy
          </button>
          <button
            className={`filter-btn ${category === 'neutral' ? 'active' : ''}`}
            onClick={() => setCategory('neutral')}
          >
            😐 Neutral
          </button>
          <button
            className={`filter-btn ${category === 'negative' ? 'active' : ''}`}
            onClick={() => setCategory('negative')}
          >
            😔 Sad
          </button>
        </div>
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
          {filteredMoods.map((mood) => (
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
