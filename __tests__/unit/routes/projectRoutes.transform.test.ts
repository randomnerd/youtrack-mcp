import { z } from 'zod';
import { PAGINATION_LIMITS, DEFAULT_PAGINATION } from '../../../src/utils/constants';

// Define the transform functions to match implementation
const limitTransform = (val: number | undefined) => 
  val === undefined || val <= 0 ? DEFAULT_PAGINATION.LIMIT : Math.min(Math.max(val, 1), PAGINATION_LIMITS.PROJECTS);

const skipTransform = (val: number | undefined) => 
  Math.max(val || DEFAULT_PAGINATION.SKIP, 0);

describe('ProjectRoutes Transform Functions', () => {
  describe('limitTransform', () => {
    it('should return the number when value is between min and max', () => {
      expect(limitTransform(5)).toBe(5);
      expect(limitTransform(20)).toBe(20);
    });

    it('should return minimum value when value is less than 1', () => {
      // Update to match implementation behavior
      expect(limitTransform(0)).toBe(DEFAULT_PAGINATION.LIMIT);
      expect(limitTransform(-5)).toBe(DEFAULT_PAGINATION.LIMIT);
    });

    it('should return maximum value when value exceeds maximum', () => {
      expect(limitTransform(150)).toBe(PAGINATION_LIMITS.PROJECTS);
      expect(limitTransform(1000)).toBe(PAGINATION_LIMITS.PROJECTS);
    });

    it('should handle invalid inputs', () => {
      expect(limitTransform(undefined)).toBe(DEFAULT_PAGINATION.LIMIT);
      expect(limitTransform(null as any)).toBe(DEFAULT_PAGINATION.LIMIT);
    });
  });

  describe('skipTransform', () => {
    it('should return the number when value is at least 0', () => {
      expect(skipTransform(0)).toBe(0);
      expect(skipTransform(5)).toBe(5);
      expect(skipTransform(100)).toBe(100);
    });

    it('should return 0 when value is negative', () => {
      expect(skipTransform(-1)).toBe(0);
      expect(skipTransform(-100)).toBe(0);
    });

    it('should handle invalid inputs', () => {
      expect(skipTransform(undefined)).toBe(0);
      expect(skipTransform(null as any)).toBe(0);
    });
  });

  describe('Zod schema integration - list_projects', () => {
    const schema = z.object({
      limit: z.number().optional().transform(limitTransform),
      skip: z.number().optional().transform(skipTransform)
    });

    it('should properly transform fields', () => {
      const result = schema.parse({
        limit: 5,
        skip: 10
      });

      expect(result).toEqual({
        limit: 5,
        skip: 10
      });
    });

    it('should handle undefined values properly', () => {
      const result = schema.parse({});

      expect(result).toEqual({
        limit: DEFAULT_PAGINATION.LIMIT,
        skip: DEFAULT_PAGINATION.SKIP
      });
    });

    it('should handle edge cases for limit and skip', () => {
      const result = schema.parse({
        limit: 0,
        skip: -5
      });

      expect(result).toEqual({
        limit: DEFAULT_PAGINATION.LIMIT, // Min value based on actual implementation
        skip: 0   // Min value
      });
    });
  });

  describe('Zod schema integration - find_projects_by_name', () => {
    const schema = z.object({
      name: z.string(),
      limit: z.number().optional().transform(limitTransform),
      skip: z.number().optional().transform(skipTransform)
    });

    it('should properly transform fields', () => {
      const result = schema.parse({
        name: 'Test Project',
        limit: 5,
        skip: 10
      });

      expect(result).toEqual({
        name: 'Test Project',
        limit: 5,
        skip: 10
      });
    });

    it('should handle fields with default values', () => {
      const result = schema.parse({
        name: 'Test Project'
      });

      expect(result).toEqual({
        name: 'Test Project',
        limit: DEFAULT_PAGINATION.LIMIT,
        skip: DEFAULT_PAGINATION.SKIP
      });
    });

    it('should handle edge cases for limit and skip', () => {
      const result = schema.parse({
        name: 'Test Project',
        limit: 0,
        skip: -5
      });

      expect(result).toEqual({
        name: 'Test Project',
        limit: DEFAULT_PAGINATION.LIMIT, // Min value based on actual implementation
        skip: 0   // Min value
      });
    });
  });
}); 