import { SprintModel } from '../../../src/models/sprint';
import youtrackClient from '../../../src/youtrack-client';

// Mock test data
const mockSprint = {
  id: 'sprint-1',
  name: 'Sprint 1',
  goal: 'Finish feature A'
};

// Include the status property in mock sprints to match what the implementation adds
const mockSprints = [
  { id: 'sprint-1', name: 'Sprint 1', goal: 'Finish feature A', status: 'active' },
  { id: 'sprint-2', name: 'Sprint 2', goal: 'Fix critical bugs', status: 'active' }
];

const mockIssues = [
  { id: 'issue-1', summary: 'Test Issue 1' },
  { id: 'issue-2', summary: 'Test Issue 2' }
];

// Mock the entire youtrack-client module
jest.mock('../../../src/youtrack-client', () => ({
  __esModule: true,
  default: {
    getSprint: jest.fn().mockImplementation((boardId, sprintId) => {
      if (sprintId === 'nonexistent') {
        return Promise.resolve(null);
      }
      return Promise.resolve(mockSprint);
    }),
    findSprints: jest.fn().mockImplementation((options) => {
      // Filter by sprintName if provided
      if (options.sprintName) {
        return Promise.resolve(
          mockSprints.filter(s => s.name.includes(options.sprintName))
            .map(({status, ...sprint}) => sprint) // Remove status to simulate actual API response
        );
      }
      // Return sprints without status to simulate actual API response
      return Promise.resolve(mockSprints.map(({status, ...sprint}) => sprint));
    }),
    searchIssues: jest.fn().mockImplementation((query, options = {}) => {
      // If sorting is requested, return reversed array to simulate sorting
      if (options.sortBy) {
        return Promise.resolve([...mockIssues].reverse());
      }
      return Promise.resolve(mockIssues);
    })
  }
}));

describe('SprintModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getById', () => {
    it('should return a sprint by board ID and sprint ID', async () => {
      const sprint = await SprintModel.getById('board-1', 'sprint-1');
      
      expect(sprint).toBeDefined();
      expect(sprint).toEqual(mockSprint);
      expect(youtrackClient.getSprint).toHaveBeenCalledWith('board-1', 'sprint-1');
      expect(youtrackClient.getSprint).toHaveBeenCalledTimes(1);
    });

    it('should return null for non-existent sprint ID', async () => {
      const sprint = await SprintModel.getById('board-1', 'nonexistent');
      
      expect(sprint).toBeNull();
      expect(youtrackClient.getSprint).toHaveBeenCalledWith('board-1', 'nonexistent');
      expect(youtrackClient.getSprint).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors', async () => {
      const error = new Error('API error');
      (youtrackClient.getSprint as jest.Mock).mockRejectedValue(error);
      
      await expect(SprintModel.getById('board-1', 'sprint-1')).rejects.toThrow('API error');
      expect(youtrackClient.getSprint).toHaveBeenCalledWith('board-1', 'sprint-1');
    });
  });

  describe('findSprints', () => {
    it('should find sprints by board ID', async () => {
      const sprints = await SprintModel.findSprints({ boardId: 'board-1' });
      
      expect(sprints).toBeDefined();
      expect(sprints).toEqual(mockSprints);
      expect(youtrackClient.findSprints).toHaveBeenCalledWith({ boardId: 'board-1' });
      expect(youtrackClient.findSprints).toHaveBeenCalledTimes(1);
    });

    it('should find sprints with multiple filters', async () => {
      const options = {
        boardId: 'board-1',
        status: 'active' as const,
        limit: 10,
        skip: 0
      };
      
      const sprints = await SprintModel.findSprints(options);
      
      expect(sprints).toBeDefined();
      expect(sprints).toEqual(mockSprints);
      expect(youtrackClient.findSprints).toHaveBeenCalledWith(options);
      expect(youtrackClient.findSprints).toHaveBeenCalledTimes(1);
    });

    it('should filter sprints by name', async () => {
      const sprints = await SprintModel.findSprints({ 
        boardId: 'board-1',
        sprintName: 'Sprint 1'
      });
      
      expect(sprints).toBeDefined();
      expect(sprints.length).toBe(1);
      expect(sprints[0].name).toBe('Sprint 1');
      expect(youtrackClient.findSprints).toHaveBeenCalledWith({ 
        boardId: 'board-1',
        sprintName: 'Sprint 1'
      });
    });
  });

  describe('getSprintIssues', () => {
    it('should return issues for a given sprint', async () => {
      const issues = await SprintModel.getSprintIssues('Sprint 1');
      
      expect(issues).toBeDefined();
      expect(issues).toEqual(mockIssues);
      expect(youtrackClient.searchIssues).toHaveBeenCalledWith(
        'sprint: {Sprint 1}',
        undefined
      );
      expect(youtrackClient.searchIssues).toHaveBeenCalledTimes(1);
    });

    it('should apply sort options when retrieving sprint issues', async () => {
      const options = { sortBy: 'priority', limit: 5, skip: 0 };
      const issues = await SprintModel.getSprintIssues('Sprint 1', options);
      
      expect(issues).toBeDefined();
      // We simulated sorting by returning reversed array
      expect(issues).toEqual([...mockIssues].reverse());
      expect(youtrackClient.searchIssues).toHaveBeenCalledWith(
        'sprint: {Sprint 1}',
        options
      );
    });
  });
}); 