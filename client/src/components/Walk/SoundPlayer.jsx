import React, { useEffect, useRef, useState } from 'react';

// This is like a DJ mixing multiple songs at once!
export default function SoundPlayer({ theme, isActive }) {
  
  // === STATE (Memory) ===
  // Think of these like settings you can change
  
  const [volume, setVolume] = useState(0.5);  
  // How loud? (0.5 = 50%)
  
  const [isMuted, setIsMuted] = useState(false);  
  // Is sound off? (false = sound is ON)
  
  const [isPlaying, setIsPlaying] = useState(false);  
  // Are sounds playing? (false = not playing yet)
  
  const audioRefs = useRef([]);  
  // This remembers all our sound players
  // Like having 3 CD players at once!

  // === FUNCTION 1: Which sounds to play? ===
  const getSoundsForTheme = (theme) => {
    // This is like choosing which CDs to put in each player
    
    const soundMap = {
      ocean: [
        { file: 'waves.mp3', volume: 0.7 },      // Loud waves
        { file: 'seagulls.mp3', volume: 0.3 },   // Quiet seagulls
        { file: 'breeze.mp3', volume: 0.4 }      // Medium breeze
      ],
      rain: [
        { file: 'light-rain.mp3', volume: 0.8 },
        { file: 'thunder.mp3', volume: 0.2 },
        { file: 'wind-chimes.mp3', volume: 0.3 }
      ],
      forest: [
        { file: 'birds.mp3', volume: 70 },
        { file: 'stream.mp3', volume: 70 },
        { file: 'leaves.mp3', volume:70 }
      ],
      mountain: [
        { file: 'wind.mp3', volume: 0.6 },
        { file: 'eagles.mp3', volume: 0.3 }
      ],
      aurora: [
        { file: 'ambient.mp3', volume: 0.7 },
        { file: 'chimes.mp3', volume: 0.4 }
      ],
      desert: [
        { file: 'wind.mp3', volume: 0.5 },
        { file: 'drums.mp3', volume: 0.2 }
      ]
    };

    return soundMap[theme] || soundMap.ocean;
  };

  // === WHEN COMPONENT LOADS ===
  // This runs ONCE when the walk starts
  useEffect(() => {
    const sounds = getSoundsForTheme(theme);
    
    // Create audio players (like setting up 3 CD players)
    audioRefs.current = sounds.map(sound => {
      // Create one audio player
      const audio = new Audio(`/sounds/${theme}/${sound.file}`);
      
      audio.loop = true;  
      // Keep playing forever (like repeat mode)
      
      audio.volume = sound.volume * volume;  
      // Set how loud this sound is
      
      return { 
        audio: audio,           // The actual player
        baseVolume: sound.volume  // Remember original volume
      };
    });

    // CLEANUP: When walk ends, stop all sounds
    return () => {
      audioRefs.current.forEach(({ audio }) => {
        audio.pause();           // Stop playing
        audio.currentTime = 0;   // Go back to start
      });
    };
  }, [theme]);  // Run again if theme changes

  // === WHEN WALK STARTS/STOPS ===
  useEffect(() => {
    if (isActive && !isMuted) {
      playAllSounds();  // Start playing!
    } else {
      pauseAllSounds(); // Stop playing!
    }
  }, [isActive, isMuted]);

  // === FUNCTION 2: Play All Sounds ===
  const playAllSounds = async () => {
    try {
      // Tell all 3 players to start playing
      await Promise.all(
        audioRefs.current.map(({ audio }) => audio.play())
      );
      setIsPlaying(true);
    } catch (error) {
      console.log('Need to click something first to play sounds');
      // Browsers need you to click before playing sound
    }
  };

  // === FUNCTION 3: Pause All Sounds ===
  const pauseAllSounds = () => {
    // Tell all players to stop
    audioRefs.current.forEach(({ audio }) => audio.pause());
    setIsPlaying(false);
  };

  // === FUNCTION 4: Change Volume ===
  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    
    // Update volume for ALL sounds
    audioRefs.current.forEach(({ audio, baseVolume }) => {
      audio.volume = baseVolume * newVolume;
      // If base = 0.7 and newVolume = 0.5
      // Then audio.volume = 0.35 (35%)
    });
  };

  // === FUNCTION 5: Mute Button ===
  const toggleMute = () => {
    if (isMuted) {
      playAllSounds();   // Turn sound back on
    } else {
      pauseAllSounds();  // Turn sound off
    }
    setIsMuted(!isMuted); // Switch the setting
  };

  // === WHAT THE USER SEES ===
  return (
    <div className="sound-player">
      
      {/* Header */}
      <div className="sound-player-header">
        <span className="sound-icon">🎵</span>
        <span className="sound-label">Ambient Sounds</span>
      </div>

      {/* Controls */}
      <div className="sound-controls">
        
        {/* Mute Button */}
        <button 
          className="mute-button"
          onClick={toggleMute}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        {/* Volume Slider */}
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={isMuted ? 0 : volume}
          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
          className="volume-slider"
        />

        {/* Volume Percentage */}
        <span className="volume-percent">
          {isMuted ? '0' : Math.round(volume * 100)}%
        </span>
      </div>

      {/* Sound Visualizer (animated bars) */}
      {isPlaying && (
        <div className="sound-visualizer">
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
        </div>
      )}
    </div>
  );
}