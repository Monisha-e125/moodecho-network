import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { walkService } from '../../services/walk';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';
import '../../assets/styles/walk.css';
import SoundPlayer from './SoundPlayer';
export default function WalkExperience() {
  const { walkId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [walk, setWalk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentCheckpoint, setCurrentCheckpoint] = useState(0);
  const [partnerProgress, setPartnerProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  const intervalRef = useRef(null);
  const socket = useSocket();

  useEffect(() => {
    loadWalk();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      socket.leaveWalk(walkId);
    };
  }, [walkId]);

  const loadWalk = async () => {
    try {
      const result = await walkService.getWalk(walkId);
      setWalk(result.data.walk);
      setTimeRemaining(result.data.walk.duration * 60);
      
      // Join socket room
      socket.joinWalk(walkId, user.id, user.username);
      
      // Listen for partner updates
      socket.onPartnerProgress((data) => {
        setPartnerProgress(data.progress);
      });

      socket.onCheckpointUpdate((data) => {
        // Partner reached checkpoint
        console.log('Partner reached checkpoint:', data.checkpoint);
      });

      setLoading(false);
    } catch (error) {
      console.error('Failed to load walk:', error);
      navigate('/walk');
    }
  };

  const handleStart = async () => {
    try {
      await walkService.startWalk(walkId);
      setStarted(true);
      startWalkTimer();
    } catch (error) {
      alert('Failed to start walk');
    }
  };

  const startWalkTimer = () => {
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          handleComplete();
          return 0;
        }
        
        const newTime = prev - 1;
        const newProgress = ((walk.duration * 60 - newTime) / (walk.duration * 60)) * 100;
        setProgress(newProgress);
        
        // Send progress to partner
        socket.sendProgress(walkId, newProgress, walk.duration * 60 - newTime);
        
        // Check checkpoints
        walk.checkpoints.forEach((checkpoint, i) => {
          if (i === currentCheckpoint && (walk.duration * 60 - newTime) >= checkpoint.time * 60) {
            setCurrentCheckpoint(i + 1);
            socket.sendCheckpoint(walkId, checkpoint.checkpoint);
          }
        });
        
        return newTime;
      });
    }, 1000);
  };

  const handleComplete = () => {
    navigate(`/walk/${walkId}/feedback`);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your mood walk...</p>
      </div>
    );
  }

  return (
    <div className={`walk-experience theme-${walk.theme}`}>
      <div className="walk-ambient-bg" style={{
        background: `linear-gradient(135deg, ${walk.ambience.colorPalette.join(', ')})`
      }}>
        <div className="ambient-particles"></div>
      </div>
       {/* ADD THIS: Sound Player */}
      {walk && (
        <SoundPlayer 
          theme={walk.theme}      // Which theme? (ocean, rain, etc.)
          isActive={started}      // Should sounds play? (true/false)
        />
      )}

      <div className="walk-content">
        <div className="walk-header">
          <h2>{walk.theme.charAt(0).toUpperCase() + walk.theme.slice(1)} Walk</h2>
          <p className="walk-description">{walk.ambience.description}</p>
        </div>

        {!started ? (
          <div className="walk-start">
            <div className="walk-info-grid">
              <div className="walk-info-item">
                <span className="info-icon">⏱️</span>
                <div>
                  <strong>Duration</strong>
                  <p>{walk.duration} minutes</p>
                </div>
              </div>

              <div className="walk-info-item">
                <span className="info-icon">🎭</span>
                <div>
                  <strong>Ambience</strong>
                  <p>{walk.ambience.intensity} - {walk.ambience.tempo}</p>
                </div>
              </div>

              <div className="walk-info-item">
                <span className="info-icon">🤝</span>
                <div>
                  <strong>Compatibility</strong>
                  <p>{walk.compatibilityScore}/100</p>
                </div>
              </div>
            </div>

            <div className="walk-sounds">
              <h3>🎵 Sounds</h3>
              <div className="sound-tags">
                {walk.ambience.sounds.map((sound, i) => (
                  <span key={i} className="sound-tag">{sound}</span>
                ))}
              </div>
            </div>

            <div className="walk-checkpoints">
              <h3>📍 Journey Checkpoints</h3>
              {walk.checkpoints.map((checkpoint, i) => (
                <div key={i} className="checkpoint-preview">
                  <span className="checkpoint-number">{i + 1}</span>
                  <span className="checkpoint-time">{checkpoint.time} min</span>
                  <p>{checkpoint.message}</p>
                </div>
              ))}
            </div>

            <button
              className="btn-primary btn-large"
              onClick={handleStart}
            >
              🚀 Begin Your Journey
            </button>
          </div>
        ) : (
          <div className="walk-active">
            <div className="walk-timer">
              <h3>{formatTime(timeRemaining)}</h3>
              <p>remaining</p>
            </div>

            <div className="progress-container">
              <div className="progress-label">Your Progress</div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="progress-percent">{Math.round(progress)}%</div>
            </div>

            <div className="progress-container partner-progress">
              <div className="progress-label">Partner's Progress</div>
              <div className="progress-bar">
                <div 
                  className="progress-fill partner"
                  style={{ width: `${partnerProgress}%` }}
                ></div>
              </div>
              <div className="progress-percent">{Math.round(partnerProgress)}%</div>
            </div>

            {walk.checkpoints[currentCheckpoint] && (
              <div className="current-checkpoint">
                <div className="checkpoint-icon">✨</div>
                <p className="checkpoint-message">
                  {walk.checkpoints[currentCheckpoint].message}
                </p>
              </div>
            )}

            <div className="visual-elements">
              {walk.ambience.visualElements.slice(0, 3).map((element, i) => (
                <span key={i} className="visual-element">
                  {element}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}