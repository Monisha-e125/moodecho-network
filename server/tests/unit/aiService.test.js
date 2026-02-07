const aiService = require('../../src/services/aiService');
const Mood = require('../../src/models/Mood');

describe('AI Service', () => {
  
  describe('analyzeSentiment', () => {
    it('should detect positive sentiment', () => {
      // Use milder positive words
      const result = aiService.analyzeSentiment('I am feeling good and content today');
      
      // Accept both positive and very_positive
      expect(['positive', 'very_positive']).toContain(result.type);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should detect very positive sentiment', () => {
      // Use strong positive words
      const result = aiService.analyzeSentiment('I am feeling amazing and happy!');
      expect(result.type).toBe('very_positive');
      expect(result.score).toBeGreaterThan(2);
    });

    it('should detect negative sentiment', () => {
      // Use milder negative words
      const result = aiService.analyzeSentiment('I feel sad today');
      
      // Accept both negative and very_negative
      expect(['negative', 'very_negative']).toContain(result.type);
      expect(result.score).toBeLessThan(0);
    });

    it('should detect very negative sentiment', () => {
      // Use strong negative words
      const result = aiService.analyzeSentiment('I feel terrible and awful');
      expect(result.type).toBe('very_negative');
      expect(result.score).toBeLessThan(-2);
    });

    it('should handle empty text', () => {
      const result = aiService.analyzeSentiment('');
      expect(result.type).toBe('neutral');
      expect(result.score).toBe(0);
    });

    it('should handle null text', () => {
      const result = aiService.analyzeSentiment(null);
      expect(result.type).toBe('neutral');
      expect(result.score).toBe(0);
    });

    it('should detect neutral sentiment', () => {
      const result = aiService.analyzeSentiment('The weather is okay');
      expect(result.type).toBe('neutral');
    });

    it('should return tokens array', () => {
      const result = aiService.analyzeSentiment('I am happy');
      expect(result.tokens).toBeDefined();
      expect(Array.isArray(result.tokens)).toBe(true);
    });

    it('should return positive and negative word arrays', () => {
      const result = aiService.analyzeSentiment('I am happy but sad');
      expect(result.positive).toBeDefined();
      expect(result.negative).toBeDefined();
      expect(Array.isArray(result.positive)).toBe(true);
      expect(Array.isArray(result.negative)).toBe(true);
    });
  });

  describe('isAnomalousEntry', () => {
    it('should detect anomaly when score differs significantly', () => {
      const isAnomaly = aiService.isAnomalousEntry(2, 8);
      expect(isAnomaly).toBe(true);
    });

    it('should not detect anomaly for normal variance', () => {
      const isAnomaly = aiService.isAnomalousEntry(7, 8);
      expect(isAnomaly).toBe(false);
    });

    it('should detect anomaly when mood is much higher', () => {
      const isAnomaly = aiService.isAnomalousEntry(9, 4);
      expect(isAnomaly).toBe(true);
    });

    it('should not detect anomaly for exact match', () => {
      const isAnomaly = aiService.isAnomalousEntry(5, 5);
      expect(isAnomaly).toBe(false);
    });

    it('should detect anomaly with 4+ point difference', () => {
      const isAnomaly = aiService.isAnomalousEntry(1, 5);
      expect(isAnomaly).toBe(true);
    });

    it('should not detect anomaly with 2 point difference', () => {
      const isAnomaly = aiService.isAnomalousEntry(5, 7);
      expect(isAnomaly).toBe(false);
    });
  });

  describe('getTrendMessage', () => {
    it('should return improving message', () => {
      const message = aiService.getTrendMessage('improving', 8.5);
      expect(message).toContain('improving');
      expect(message).toMatch('8.5');
    });

    it('should return declining message', () => {
      const message = aiService.getTrendMessage('declining', 4.5);
      expect(message).toContain('self-care');
      expect(message).toMatch('4.5');
    });

    it('should return stable message', () => {
      const message = aiService.getTrendMessage('stable', 7.0);
      expect(message).toContain('stable');
      expect(message).toMatch(/7(\.0)?/);
    });
  });
});