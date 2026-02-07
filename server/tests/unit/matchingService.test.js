const matchingService = require('../../src/services/matchingService');

describe('Matching Service', () => {
  
  describe('getCompatibilityRating', () => {
    it('should return Excellent Match for 80+', () => {
      const rating = matchingService.getCompatibilityRating(85);
      expect(rating).toBe('Excellent Match');
    });

    it('should return Great Match for 60-79', () => {
      const rating = matchingService.getCompatibilityRating(70);
      expect(rating).toBe('Great Match');
    });

    it('should return Good Match for 40-59', () => {
      const rating = matchingService.getCompatibilityRating(50);
      expect(rating).toBe('Good Match');
    });

    it('should return Fair Match for 20-39', () => {
      const rating = matchingService.getCompatibilityRating(30);
      expect(rating).toBe('Fair Match');
    });

    it('should return Low Match for below 20', () => {
      const rating = matchingService.getCompatibilityRating(10);
      expect(rating).toBe('Low Match');
    });

    it('should handle edge case at 80', () => {
      const rating = matchingService.getCompatibilityRating(80);
      expect(rating).toBe('Excellent Match');
    });

    it('should handle edge case at 60', () => {
      const rating = matchingService.getCompatibilityRating(60);
      expect(rating).toBe('Great Match');
    });

    it('should handle edge case at 40', () => {
      const rating = matchingService.getCompatibilityRating(40);
      expect(rating).toBe('Good Match');
    });

    it('should handle edge case at 20', () => {
      const rating = matchingService.getCompatibilityRating(20);
      expect(rating).toBe('Fair Match');
    });
  });

  describe('getMatchRecommendation', () => {
    it('should recommend for 80+ score', () => {
      const rec = matchingService.getMatchRecommendation(85);
      expect(rec).toContain('similar mood patterns');
    });

    it('should recommend for 60+ score', () => {
      const rec = matchingService.getMatchRecommendation(65);
      expect(rec).toContain('Good compatibility');
    });

    it('should recommend for 40+ score', () => {
      const rec = matchingService.getMatchRecommendation(45);
      expect(rec).toContain('Decent match');
    });

    it('should recommend for low score', () => {
      const rec = matchingService.getMatchRecommendation(15);
      expect(rec).toContain('Different mood patterns');
    });
  });

  describe('calculateCompatibilityScore', () => {
    it('should calculate score for similar profiles', () => {
      const profile1 = {
        avgMood: 7.5,
        dominantSentiment: 'positive',
        dayAverages: { Monday: 7, Tuesday: 8 },
        totalEntries: 10
      };

      const profile2 = {
        avgMood: 7.8,
        dominantSentiment: 'positive',
        dayAverages: { Monday: 7.5, Tuesday: 7.8 },
        totalEntries: 10
      };

      const score = matchingService.calculateCompatibilityScore(profile1, profile2);
      
      expect(score).toBeGreaterThan(50);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should give lower score for different sentiments', () => {
      const profile1 = {
        avgMood: 7.5,
        dominantSentiment: 'positive',
        dayAverages: {},
        totalEntries: 5
      };

      const profile2 = {
        avgMood: 3.5,
        dominantSentiment: 'negative',
        dayAverages: {},
        totalEntries: 5
      };

      const score = matchingService.calculateCompatibilityScore(profile1, profile2);
      
      expect(score).toBeLessThan(50);
    });
  });
});