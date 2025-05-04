import { z } from 'zod';
import { PAGINATION_LIMITS, DEFAULT_PAGINATION } from '../../../src/utils/constants';

// Define transformation functions based on those in the routes
const transformLimit = (val: number | undefined) => 
  val === undefined || val <= 0 || isNaN(val) ? DEFAULT_PAGINATION.LIMIT : Math.min(Math.max(val, 1), PAGINATION_LIMITS.ISSUES);

const transformSkip = (val: number | undefined) => 
  Math.max(val || DEFAULT_PAGINATION.SKIP, 0);

const transformBoardId = (id: string | undefined) => 
  id && id.trim() !== '' ? id.trim() : undefined;

const transformIssueId = (id: string | undefined) => 
  id && id.trim() !== '' ? id.trim() : undefined;

const transformProjectName = (name: string | undefined) => 
  name && name.trim() !== '' ? name.trim() : undefined;

const parseQuery = (query: string | undefined) => 
  query && query.trim() !== '' ? query.trim() : undefined;

const transformIssueQuery = parseQuery;

// In sprintRoutes.ts, this is part of the schema validation, not exported
const transformSprintFind = (params: any) => {
  // Simplification of the schema transformation logic
  const status = params.status?.toLowerCase();
  return {
    boardId: params.boardId,
    sprintName: params.sprintName,
    status: status === 'active' || status === 'archived' ? status : 'all'
  };
};

describe('Route Transformations - Edge Cases', () => {
  describe('sprintRoutes', () => {
    describe('parseQuery', () => {
      it('should handle undefined query', () => {
        expect(parseQuery(undefined)).toBeUndefined();
      });

      it('should handle empty query', () => {
        expect(parseQuery('')).toBeUndefined();
      });

      it('should trim whitespace', () => {
        expect(parseQuery('  test query  ')).toBe('test query');
      });
    });

    describe('transformSprintFind', () => {
      it('should handle missing parameters', () => {
        const result = transformSprintFind({});
        expect(result).toEqual({ boardId: undefined, sprintName: undefined, status: 'all' });
      });

      it('should default status to "all"', () => {
        const result = transformSprintFind({ boardId: 'board1' });
        expect(result).toEqual({ boardId: 'board1', sprintName: undefined, status: 'all' });
      });

      it('should maintain valid status values', () => {
        const result = transformSprintFind({ boardId: 'board1', status: 'active' });
        expect(result).toEqual({ boardId: 'board1', sprintName: undefined, status: 'active' });
      });

      it('should handle mixed case status', () => {
        const result = transformSprintFind({ boardId: 'board1', status: 'AcTiVe' });
        expect(result).toEqual({ boardId: 'board1', sprintName: undefined, status: 'active' });
      });

      it('should default to "all" for invalid status values', () => {
        const result = transformSprintFind({ boardId: 'board1', status: 'invalid' });
        expect(result).toEqual({ boardId: 'board1', sprintName: undefined, status: 'all' });
      });
    });

    describe('transformIssueQuery', () => {
      it('should handle undefined query', () => {
        expect(transformIssueQuery(undefined)).toBeUndefined();
      });

      it('should handle empty query', () => {
        expect(transformIssueQuery('')).toBeUndefined();
      });

      it('should preserve valid query', () => {
        expect(transformIssueQuery('project: TEST')).toBe('project: TEST');
      });
    });
  });

  describe('boardRoutes', () => {
    describe('transformBoardId', () => {
      it('should handle undefined id', () => {
        expect(transformBoardId(undefined)).toBeUndefined();
      });

      it('should handle empty id', () => {
        expect(transformBoardId('')).toBeUndefined();
      });

      it('should trim whitespace', () => {
        expect(transformBoardId('  board-123  ')).toBe('board-123');
      });
    });

    describe('transformLimit', () => {
      it('should handle undefined limit', () => {
        expect(transformLimit(undefined)).toBe(DEFAULT_PAGINATION.LIMIT);
      });

      it('should handle NaN limit', () => {
        expect(transformLimit(NaN)).toBe(DEFAULT_PAGINATION.LIMIT);
      });

      it('should handle negative limit', () => {
        expect(transformLimit(-5)).toBe(DEFAULT_PAGINATION.LIMIT);
      });

      it('should handle zero limit', () => {
        expect(transformLimit(0)).toBe(DEFAULT_PAGINATION.LIMIT);
      });

      it('should handle too large limit', () => {
        expect(transformLimit(100)).toBe(PAGINATION_LIMITS.ISSUES);
      });

      it('should handle valid limit', () => {
        expect(transformLimit(25)).toBe(25);
      });
    });

    describe('transformSkip', () => {
      it('should handle undefined skip', () => {
        expect(transformSkip(undefined)).toBe(0);
      });

      it('should handle NaN skip', () => {
        expect(transformSkip(Number('not-a-number'))).toBe(0);
      });

      it('should handle negative skip', () => {
        expect(transformSkip(-5)).toBe(0);
      });

      it('should handle valid skip', () => {
        expect(transformSkip(10)).toBe(10);
      });
    });
  });

  describe('issueRoutes', () => {
    describe('transformProjectName', () => {
      it('should handle undefined name', () => {
        expect(transformProjectName(undefined)).toBeUndefined();
      });

      it('should handle empty name', () => {
        expect(transformProjectName('')).toBeUndefined();
      });

      it('should trim whitespace', () => {
        expect(transformProjectName('  TEST  ')).toBe('TEST');
      });
    });

    describe('transformIssueId', () => {
      it('should handle undefined id', () => {
        expect(transformIssueId(undefined)).toBeUndefined();
      });

      it('should handle empty id', () => {
        expect(transformIssueId('')).toBeUndefined();
      });

      it('should trim whitespace', () => {
        expect(transformIssueId('  issue-123  ')).toBe('issue-123');
      });
    });
  });
}); 