import React, { useState } from 'react';
import MoodLogger from '../components/Mood/MoodLogger';
import MoodHistory from '../components/Mood/MoodHistory';
import MoodStats from '../components/Mood/MoodStats';
import MoodCard from '../components/Mood/MoodCard';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('log');
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useAuth();

  const handleMoodLogged = () => {
    setRefreshKey(prev => prev + 1);
    // Auto-switch to history after logging
    setTimeout(() => setActiveTab('history'), 2000);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user.username}! 👋</h1>
        <p>Track your moods, discover patterns, and connect with others</p>
      </div>

      <div className="dashboard-tabs">
        <button
          className={activeTab === 'log' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('log')}
        >
          📝 Log Mood
        </button>
        <button
          className={activeTab === 'history' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('history')}
        >
          📚 History
        </button>
        <button
          className={activeTab === 'stats' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('stats')}
        >
          📊 Statistics
        </button>
        <button
          className={activeTab === 'card' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('card')}
        >
          📊 card
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'log' && <MoodLogger onMoodLogged={handleMoodLogged} />}
        {activeTab === 'history' && <MoodHistory key={refreshKey} />}
        {activeTab === 'stats' && <MoodStats key={refreshKey} />}
        {activeTab === 'card' && <MoodCard key={refreshKey} />}
      </div>
    </div>
  );
}