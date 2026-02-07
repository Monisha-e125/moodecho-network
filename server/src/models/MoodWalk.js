const mongoose = require('mongoose');

const moodWalkSchema = new mongoose.Schema({
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: String,
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  theme: {
    type: String,
    enum: ['ocean', 'rain', 'forest', 'mountain', 'aurora', 'desert'],
    required: true
  },
  
  ambience: {
    sounds: [{
      type: String
    }],
    visualElements: [{
      type: String
    }],
    colorPalette: [{
      type: String
    }],
    description: String
  },
  
  duration: {
    type: Number, // in minutes
    default: 10,
    min: 5,
    max: 30
  },
  
  compatibilityScore: {
    type: Number,
    min: 0,
    max: 100
  },
  
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed', 'abandoned'],
    default: 'waiting'
  },
  
  startedAt: {
    type: Date,
    default: null
  },
  
  completedAt: {
    type: Date,
    default: null
  },
  
  feedback: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
moodWalkSchema.index({ 'participants.userId': 1 });
moodWalkSchema.index({ status: 1 });
moodWalkSchema.index({ createdAt: -1 });

module.exports = mongoose.model('MoodWalk', moodWalkSchema);