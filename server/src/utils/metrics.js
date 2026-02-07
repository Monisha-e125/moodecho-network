const logger = require('./logger');

class MetricsService {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      moodsLogged: 0,
      walksCreated: 0,
      matchesFound: 0,
      activeUsers: new Set(),
      responseTime: []
    };
  }

  // Track API request
  trackRequest(req) {
    this.metrics.requests++;
    this.metrics.activeUsers.add(req.ip);
  }

  // Track error
  trackError(error) {
    this.metrics.errors++;
    logger.error('Error tracked:', error);
  }

  // Track mood logged
  trackMoodLogged() {
    this.metrics.moodsLogged++;
  }

  // Track walk created
  trackWalkCreated() {
    this.metrics.walksCreated++;
  }

  // Track match found
  trackMatch() {
    this.metrics.matchesFound++;
  }

  // Track response time
  trackResponseTime(duration) {
    this.metrics.responseTime.push(duration);
    // Keep only last 1000 entries
    if (this.metrics.responseTime.length > 1000) {
      this.metrics.responseTime.shift();
    }
  }

  // Get current metrics
  getMetrics() {
    const avgResponseTime = this.metrics.responseTime.length > 0
      ? this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length
      : 0;

    return {
      totalRequests: this.metrics.requests,
      totalErrors: this.metrics.errors,
      moodsLogged: this.metrics.moodsLogged,
      walksCreated: this.metrics.walksCreated,
      matchesFound: this.metrics.matchesFound,
      activeUsers: this.metrics.activeUsers.size,
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: this.metrics.requests > 0 
        ? ((this.metrics.errors / this.metrics.requests) * 100).toFixed(2)
        : 0
    };
  }

  // Reset metrics (for testing)
  reset() {
    this.metrics = {
      requests: 0,
      errors: 0,
      moodsLogged: 0,
      walksCreated: 0,
      matchesFound: 0,
      activeUsers: new Set(),
      responseTime: []
    };
  }
}

module.exports = new MetricsService();