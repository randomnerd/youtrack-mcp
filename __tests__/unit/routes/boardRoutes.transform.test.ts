import { z } from 'zod';
import { PAGINATION_LIMITS, DEFAULT_PAGINATION } from '../../../src/utils/constants';

const transformLimit = (val?: number) => 
  val === undefined || val <= 0 ? DEFAULT_PAGINATION.LIMIT : Math.min(Math.max(val, 1), PAGINATION_LIMITS.BOARDS);

const transformSkip = (val?: number) => Math.max(val || DEFAULT_PAGINATION.SKIP, 0);

describe('Board Routes Parameter Transformations', () => {
  describe('limit parameter transformation', () => {
    it('should use default limit when value is undefined', () => {
      const result = transformLimit(undefined);
      expect(result).toBe(DEFAULT_PAGINATION.LIMIT);
    });

    it('should use default limit when value is 0', () => {
      const result = transformLimit(0);
      expect(result).toBe(DEFAULT_PAGINATION.LIMIT);
    });

    it('should use default limit when value is negative', () => {
      const result = transformLimit(-5);
      expect(result).toBe(DEFAULT_PAGINATION.LIMIT);
    });

    it('should cap value to maximum limit', () => {
      const result = transformLimit(PAGINATION_LIMITS.BOARDS + 10);
      expect(result).toBe(PAGINATION_LIMITS.BOARDS);
    });

    it('should use provided value when within valid range', () => {
      const value = Math.floor(PAGINATION_LIMITS.BOARDS / 2);
      const result = transformLimit(value);
      expect(result).toBe(value);
    });

    it('should use minimum value of 1 when provided value is less than 1 but greater than 0', () => {
      const result = transformLimit(0.5);
      expect(result).toBe(1);
    });
  });

  describe('skip parameter transformation', () => {
    it('should use 0 when value is undefined', () => {
      const result = transformSkip(undefined);
      expect(result).toBe(0);
    });

    it('should use provided value when positive', () => {
      const result = transformSkip(10);
      expect(result).toBe(10);
    });

    it('should use 0 when value is negative', () => {
      const result = transformSkip(-5);
      expect(result).toBe(0);
    });

    it('should use DEFAULT_PAGINATION.SKIP when explicit 0 is provided', () => {
      const result = transformSkip(0);
      expect(result).toBe(0);
    });
  });

  describe('Zod schema transformations', () => {
    const limitSchema = z.number().optional().transform(transformLimit);
    const skipSchema = z.number().optional().transform(transformSkip);

    it('should transform limit using Zod', () => {
      expect(limitSchema.parse(undefined)).toBe(DEFAULT_PAGINATION.LIMIT);
      expect(limitSchema.parse(0)).toBe(DEFAULT_PAGINATION.LIMIT);
      expect(limitSchema.parse(-5)).toBe(DEFAULT_PAGINATION.LIMIT);
      expect(limitSchema.parse(PAGINATION_LIMITS.BOARDS + 100)).toBe(PAGINATION_LIMITS.BOARDS);
      expect(limitSchema.parse(10)).toBe(10);
    });

    it('should transform skip using Zod', () => {
      expect(skipSchema.parse(undefined)).toBe(0);
      expect(skipSchema.parse(0)).toBe(0);
      expect(skipSchema.parse(-5)).toBe(0);
      expect(skipSchema.parse(10)).toBe(10);
    });
  });
}); 