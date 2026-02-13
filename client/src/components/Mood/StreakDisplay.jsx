import React, { useEffect, useState } from 'react';

export default function StreakDisplay() {
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStreak();
  }, []);

  const loadStreak = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Loading streak...');
      
      const response = await fetch('http://localhost:4000/api/streak/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Streak data:', data);
      
      setStreak(data.data);
      setLoading(false);
      
    } catch (error) {
      console.error('❌ Streak error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '10px',
        margin: '20px 0'
      }}>
        Loading streak...
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div style={{
        background: '#fee2e2',
        padding: '20px',
        borderRadius: '10px',
        margin: '20px 0',
        color: '#991b1b'
      }}>
        <strong>Streak Error:</strong> {error}
        <br />
        <button onClick={loadStreak}>Try Again</button>
      </div>
    );
  }

  // Show streak
  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '30px',
      borderRadius: '16px',
      margin: '20px 0',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '60px', marginBottom: '10px' }}>
        🔥
      </div>
      <div style={{ fontSize: '48px', fontWeight: 'bold' }}>
        {streak?.current || 0}
      </div>
      <div style={{ fontSize: '18px', opacity: 0.9 }}>
        Day Streak
      </div>
      <div style={{ 
        marginTop: '20px', 
        padding: '10px',
        background: 'rgba(255,255,255,0.2)',
        borderRadius: '8px'
      }}>
        <strong>Longest:</strong> {streak?.longest || 0} days
      </div>
    </div>
  );
}