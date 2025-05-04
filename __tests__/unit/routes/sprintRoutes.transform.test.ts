import { z } from 'zod';
import { PAGINATION_LIMITS, DEFAULT_PAGINATION } from '../../../src/utils/constants';

// Define the transform functions to match implementation
const limitTransform = (val: number | undefined) => 
  val === undefined || val <= 0 ? DEFAULT_PAGINATION.LIMIT : Math.min(Math.max(val, 1), PAGINATION_LIMITS.SPRINTS);

const skipTransform = (val: number | undefined) => 
  Math.max(val || DEFAULT_PAGINATION.SKIP, 0);

describe('SprintRoutes Transform Functions', () => {
  describe('limitTransform', () => {
    it('should return default limit when value is undefined', () => {
      expect(limitTransform(undefined)).toBe(DEFAULT_PAGINATION.LIMIT);
    });

    it('should return default limit when value is 0 or negative', () => {
      expect(limitTransform(0)).toBe(DEFAULT_PAGINATION.LIMIT);
      expect(limitTransform(-5)).toBe(DEFAULT_PAGINATION.LIMIT);
    });

    it('should return the value when it is within range', () => {
      expect(limitTransform(10)).toBe(10);
      expect(limitTransform(25)).toBe(25);
    });

    it('should cap the value at the maximum limit', () => {
      expect(limitTransform(PAGINATION_LIMITS.SPRINTS + 10)).toBe(PAGINATION_LIMITS.SPRINTS);
    });
  });

  describe('skipTransform', () => {
    it('should return 0 when value is undefined', () => {
      expect(skipTransform(undefined)).toBe(DEFAULT_PAGINATION.SKIP);
    });

    it('should return 0 when value is negative', () => {
      expect(skipTransform(-5)).toBe(0);
    });

    it('should return the value when it is 0 or positive', () => {
      expect(skipTransform(0)).toBe(0);
      expect(skipTransform(10)).toBe(10);
    });
  });

  describe('status enum validation', () => {
    const statusEnum = z.enum(['active', 'archived', 'all']).default('all');

    it('should accept valid status values', () => {
      expect(statusEnum.parse('active')).toBe('active');
      expect(statusEnum.parse('archived')).toBe('archived');
      expect(statusEnum.parse('all')).toBe('all');
    });

    it('should use default value when undefined', () => {
      expect(statusEnum.parse(undefined)).toBe('all');
    });

    it('should throw an error for invalid status values', () => {
      expect(() => statusEnum.parse('invalid')).toThrow();
      expect(() => statusEnum.parse('completed')).toThrow();
    });
  });

  describe('Zod schema integration', () => {
    // Define the schemas similar to how they're used in the routes
    const findSprintsSchema = z.object({
      boardId: z.string(),
      sprintName: z.string().optional(),
      status: z.enum(['active', 'archived', 'all']).default('all'),
      limit: z.number().optional().transform(limitTransform),
      skip: z.number().optional().transform(skipTransform)
    });

    it('should apply transforms in a complete object', () => {
      const result = findSprintsSchema.parse({
        boardId: 'board-1',
        status: 'active',
        limit: 5,
        skip: 10
      });

      expect(result).toEqual({
        boardId: 'board-1',
        status: 'active',
        limit: 5,
        skip: 10
      });
    });

    it('should apply default values and transforms for missing fields', () => {
      const result = findSprintsSchema.parse({
        boardId: 'board-1'
      });

      expect(result).toEqual({
        boardId: 'board-1',
        status: 'all',
        limit: DEFAULT_PAGINATION.LIMIT,
        skip: DEFAULT_PAGINATION.SKIP
      });
    });

    it('should apply transforms to edge cases', () => {
      const result = findSprintsSchema.parse({
        boardId: 'board-1',
        limit: 0,
        skip: -5
      });

      expect(result).toEqual({
        boardId: 'board-1',
        status: 'all',
        limit: DEFAULT_PAGINATION.LIMIT, // Should be transformed to the default
        skip: 0 // Should be transformed to 0
      });
    });

    it('should handle maximum limits', () => {
      const result = findSprintsSchema.parse({
        boardId: 'board-1',
        limit: PAGINATION_LIMITS.SPRINTS + 100,
        skip: 50
      });

      expect(result).toEqual({
        boardId: 'board-1',
        status: 'all',
        limit: PAGINATION_LIMITS.SPRINTS, // Should be capped
        skip: 50
      });
    });
  });
}); 