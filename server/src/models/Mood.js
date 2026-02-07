const mongoose = require('mongoose');

const moodSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  emoji: {
    type: String,
    required: true,
    enum: ['😢', '😊', '😤', '😴', '😰', '😌', '🤗', '😔']
  },
  moodScore: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
  note: {
    type: String,
    maxlength: 500,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  context: {
    timeOfDay: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night']
    },
    weather: String,
    location: String
  },
  
  sentiment: {
    type: String,
    enum: ['very_negative', 'negative', 'neutral', 'positive', 'very_positive']
  },
  emotions: [{
    type: String,
    confidence: Number
  }],
  
  weekPattern: [String],
  isAnomaly: {
    type: Boolean,
    default: false
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
moodSchema.index({ userId: 1, timestamp: -1 });
moodSchema.index({ userId: 1, sentiment: 1 });

// Virtual for day of week
moodSchema.virtual('dayOfWeek').get(function() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[this.timestamp.getDay()];
});

module.exports = mongoose.model('Mood', moodSchema);