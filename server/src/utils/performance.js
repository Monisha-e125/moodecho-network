const logger = require('./logger');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      apiCalls: {},
      slowQueries: [],
      errorRate: 0
    };
  }

  /**
   * Track API endpoint performance
   */
  trackEndpoint(endpoint, duration) {
    if (!this.metrics.apiCalls[endpoint]) {
      this.metrics.apiCalls[endpoint] = {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        maxTime: 0,
        minTime: Infinity
      };
    }

    const metric = this.metrics.apiCalls[endpoint];
    metric.count++;
    metric.totalTime += duration;
    metric.avgTime = metric.totalTime / metric.count;
    metric.maxTime = Math.max(metric.maxTime, duration);
    metric.minTime = Math.min(metric.minTime, duration);

    // Log slow queries
    if (duration > 1000) {
      this.metrics.slowQueries.push({
        endpoint,
        duration,
        timestamp: new Date()
      });

      logger.warn(`Slow query detected: ${endpoint} took ${duration}ms`);
    }
  }

  /**
   * Get performance report
   */
  getReport() {
    return {
      apiCalls: this.metrics.apiCalls,
      slowQueries: this.metrics.slowQueries.slice(-10), // Last 10
      summary: {
        totalCalls: Object.values(this.metrics.apiCalls)
          .reduce((sum, m) => sum + m.count, 0),
        slowestEndpoint: this.getSlowestEndpoint()
      }
    };
  }

  getSlowestEndpoint() {
    let slowest = null;
    let maxAvg = 0;

    Object.entries(this.metrics.apiCalls).forEach(([endpoint, metrics]) => {
      if (metrics.avgTime > maxAvg) {
        maxAvg = metrics.avgTime;
        slowest = endpoint;
      }
    });

    return slowest ? { endpoint: slowest, avgTime: maxAvg } : null;
  }
}

module.exports = new PerformanceMonitor();