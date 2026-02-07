const Mood = require('../models/Mood');
const Sentiment = require('sentiment');
const { roundTo } = require('../utils/helpers');

class AIService {
  constructor() {
    this.sentiment = new Sentiment();
  }

  // Analyze text sentiment
  analyzeSentiment(text) {
    if (!text || typeof text !== 'string') {
      return {
        type: 'neutral',
        score: 0,
        comparative: 0
      };
    }

    const result = this.sentiment.analyze(text);
    
    let sentimentType;
    if (result.score < -2) sentimentType = 'very_negative';
    else if (result.score < 0) sentimentType = 'negative';
    else if (result.score === 0) sentimentType = 'neutral';
    else if (result.score <= 2) sentimentType = 'positive';
    else sentimentType = 'very_positive';
    
    return {
      type: sentimentType,
      score: result.score,
      comparative: result.comparative,
      tokens: result.tokens,
      positive: result.positive,
      negative: result.negative
    };
  }

  // Detect weekly mood patterns
  async detectWeeklyPattern(userId) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const moods = await Mood.find({
      userId,
      timestamp: { $gte: sevenDaysAgo }
    }).sort({ timestamp: 1 });

    if (moods.length < 3) {
      return ['Not enough data for pattern analysis. Log more moods!'];
    }

    // Group by day of week
    const dayGroups = {};
    moods.forEach(mood => {
      const day = mood.dayOfWeek;
      if (!dayGroups[day]) dayGroups[day] = [];
      dayGroups[day].push(mood.moodScore);
    });

    // Calculate averages
    const patterns = [];
    Object.entries(dayGroups).forEach(([day, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      
      if (avg < 4) {
        patterns.push(`${day}s tend to be challenging (avg: ${roundTo(avg, 1)}/10)`);
      } else if (avg > 7) {
        patterns.push(`${day}s are usually great (avg: ${roundTo(avg, 1)}/10)`);
      }
    });

    return patterns.length ? patterns : ['Mood patterns are balanced throughout the week'];
  }

  // Predict mood trend
  async predictMoodTrend(userId) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const moods = await Mood.find({
      userId,
      timestamp: { $gte: thirtyDaysAgo }
    }).sort({ timestamp: 1 });

    if (moods.length < 5) {
      return {
        trend: 'insufficient_data',
        message: 'Need more mood entries for prediction',
        recentAverage: 0,
        change: 0
      };
    }

    // Simple linear regression
    const scores = moods.map(m => m.moodScore);
    const recentScores = scores.slice(-7);
    const olderScores = scores.slice(0, Math.min(7, scores.length - 7));

    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const olderAvg = olderScores.length > 0 
      ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length
      : recentAvg;

    const change = recentAvg - olderAvg;
    
    let trend;
    if (change > 0.5) trend = 'improving';
    else if (change < -0.5) trend = 'declining';
    else trend = 'stable';

    return {
      trend,
      recentAverage: roundTo(recentAvg, 1),
      change: roundTo(change, 1),
      message: this.getTrendMessage(trend, recentAvg)
    };
  }

  getTrendMessage(trend, avg) {
    if (trend === 'improving') {
      return `Your mood is improving! Recent average: ${avg}/10`;
    } else if (trend === 'declining') {
      return `Consider self-care activities. Recent average: ${avg}/10`;
    }
    return `Your mood is stable at ${avg}/10`;
  }

  // Detect anomalies
  isAnomalousEntry(moodScore, userAverage) {
    return Math.abs(moodScore - userAverage) > 3;
  }

  // Get mood insights
  async getMoodInsights(userId) {
    const moods = await Mood.find({ userId }).sort({ timestamp: -1 }).limit(30);

    if (moods.length < 5) {
      return {
        message: 'Keep logging moods to unlock insights!',
        insights: []
      };
    }

    const insights = [];
    
    // Most common mood
    const emojiCounts = {};
    moods.forEach(m => {
      emojiCounts[m.emoji] = (emojiCounts[m.emoji] || 0) + 1;
    });
    const mostCommon = Object.entries(emojiCounts).sort((a, b) => b[1] - a[1])[0];
    insights.push(`Your most common mood is ${mostCommon[0]} (${mostCommon[1]} times)`);

    // Average score
    const avgScore = moods.reduce((sum, m) => sum + m.moodScore, 0) / moods.length;
    insights.push(`Your average mood score is ${roundTo(avgScore, 1)}/10`);

    // Time of day analysis
    const timeGroups = {};
    moods.forEach(m => {
      if (m.context?.timeOfDay) {
        if (!timeGroups[m.context.timeOfDay]) timeGroups[m.context.timeOfDay] = [];
        timeGroups[m.context.timeOfDay].push(m.moodScore);
      }
    });

    if (Object.keys(timeGroups).length > 0) {
      const timeAvgs = Object.entries(timeGroups).map(([time, scores]) => ({
        time,
        avg: scores.reduce((a, b) => a + b, 0) / scores.length
      })).sort((a, b) => b.avg - a.avg);

      insights.push(`You feel best in the ${timeAvgs[0].time} (avg: ${roundTo(timeAvgs[0].avg, 1)}/10)`);
    }

    return {
      message: 'Here are your mood insights:',
      insights
    };
  }
}

module.exports = new AIService();