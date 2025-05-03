import { SprintModel } from '../../../src/models/sprint';

// Mock the entire youtrack-client module with simple returns
jest.mock('../../../src/youtrack-client', () => ({
  __esModule: true,
  default: {
    getSprint: jest.fn().mockResolvedValue({
      id: 'sprint-1',
      name: 'Sprint 1',
      goal: 'Finish feature A'
    }),
    findSprints: jest.fn().mockResolvedValue([
      { id: 'sprint-1', name: 'Sprint 1', goal: 'Finish feature A' },
      { id: 'sprint-2', name: 'Sprint 2', goal: 'Fix critical bugs' }
    ]),
    searchIssues: jest.fn().mockResolvedValue([
      { id: 'issue-1', summary: 'Test Issue 1' },
      { id: 'issue-2', summary: 'Test Issue 2' }
    ])
  }
}));

describe('SprintModel', () => {
  describe('getById', () => {
    it('should return a sprint by board ID and sprint ID', async () => {
      const sprint = await SprintModel.getById('board-1', 'sprint-1');
      expect(sprint).toBeDefined();
    });
  });

  describe('findSprints', () => {
    it('should find sprints by board ID', async () => {
      const sprints = await SprintModel.findSprints({ boardId: 'board-1' });
      expect(sprints).toBeDefined();
      expect(sprints.length).toBeGreaterThan(0);
    });

    it('should find sprints with multiple filters', async () => {
      const sprints = await SprintModel.findSprints({
        boardId: 'board-1',
        status: 'active',
        limit: 10
      });
      expect(sprints).toBeDefined();
      expect(sprints.length).toBeGreaterThan(0);
    });
  });

  describe('getSprintIssues', () => {
    it('should return issues for a given sprint', async () => {
      const issues = await SprintModel.getSprintIssues('Sprint 1');
      expect(issues).toBeDefined();
      expect(issues.length).toBeGreaterThan(0);
    });
  });
}); 