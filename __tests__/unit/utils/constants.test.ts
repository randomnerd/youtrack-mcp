import { PAGINATION_LIMITS, DEFAULT_PAGINATION } from '../../../src/utils/constants';

describe('Constants', () => {
  describe('PAGINATION_LIMITS', () => {
    it('should have defined pagination limits', () => {
      expect(PAGINATION_LIMITS).toBeDefined();
    });

    it('should have correct limit values', () => {
      expect(PAGINATION_LIMITS.ISSUES).toBe(50);
      expect(PAGINATION_LIMITS.PROJECTS).toBe(100);
      expect(PAGINATION_LIMITS.BOARDS).toBe(50);
      expect(PAGINATION_LIMITS.SPRINTS).toBe(50);
      expect(PAGINATION_LIMITS.COMMENTS).toBe(100);
      expect(PAGINATION_LIMITS.ATTACHMENTS).toBe(100);
      expect(PAGINATION_LIMITS.ACTIVITIES).toBe(100);
      expect(PAGINATION_LIMITS.DEFAULT).toBe(50);
    });
  });

  describe('DEFAULT_PAGINATION', () => {
    it('should have defined default pagination values', () => {
      expect(DEFAULT_PAGINATION).toBeDefined();
    });

    it('should have correct default values', () => {
      expect(DEFAULT_PAGINATION.LIMIT).toBe(10);
      expect(DEFAULT_PAGINATION.SKIP).toBe(0);
    });
  });
}); 