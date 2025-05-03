import {
  formatSprintPeriod,
  formatBoardProjects,
  formatSprintListItem,
  formatSprintDetailItem,
  formatBoardListItem,
  formatIssueStatus,
  createSeparator
} from '../../../src/utils/view-utils';
import { formatDate } from '../../../src/utils/controller-utils';

// Mock the controller-utils functions
jest.mock('../../../src/utils/controller-utils', () => ({
  formatDate: jest.fn().mockImplementation((date) => 
    date ? new Date(date).toISOString().split('T')[0] : 'N/A'
  )
}));

describe('View Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('formatSprintPeriod', () => {
    it('should format sprint period correctly', () => {
      const sprint = {
        id: 'sprint-1',
        name: 'Sprint 1',
        start: 1620000000000,
        finish: 1622000000000
      };
      
      const result = formatSprintPeriod(sprint);
      
      expect(formatDate).toHaveBeenCalledWith(sprint.start);
      expect(formatDate).toHaveBeenCalledWith(sprint.finish);
      expect(result).toContain(' - ');
    });

    it('should handle undefined dates', () => {
      const sprint = {
        id: 'sprint-1',
        name: 'Sprint 1'
      };
      
      const result = formatSprintPeriod(sprint);
      
      expect(formatDate).toHaveBeenCalledWith(undefined);
      expect(result).toBe('N/A - N/A');
    });
  });

  describe('formatBoardProjects', () => {
    it('should format board projects correctly', () => {
      const board = {
        id: 'board-1',
        name: 'Test Board',
        projects: [
          { id: 'project-1', name: 'Project 1' },
          { id: 'project-2', name: 'Project 2' }
        ]
      };
      
      const result = formatBoardProjects(board);
      
      expect(result).toBe('Project 1, Project 2');
    });

    it('should handle undefined projects', () => {
      const board = {
        id: 'board-1',
        name: 'Test Board'
      };
      
      const result = formatBoardProjects(board);
      
      expect(result).toBe('None');
    });

    it('should handle empty projects array', () => {
      const board = {
        id: 'board-1',
        name: 'Test Board',
        projects: []
      };
      
      const result = formatBoardProjects(board);
      
      expect(result).toBe('');
    });
  });

  describe('formatSprintListItem', () => {
    it('should format sprint list item correctly', () => {
      const sprint = {
        id: 'sprint-1',
        name: 'Sprint 1',
        start: 1620000000000,
        finish: 1622000000000
      };
      
      const result = formatSprintListItem(sprint);
      
      expect(result).toContain(`ID: ${sprint.id}`);
      expect(result).toContain(`Name: ${sprint.name}`);
      expect(result).toContain('Period:');
      expect(formatDate).toHaveBeenCalledWith(sprint.start);
      expect(formatDate).toHaveBeenCalledWith(sprint.finish);
    });
  });

  describe('formatSprintDetailItem', () => {
    it('should format sprint detail item correctly', () => {
      const sprint = {
        id: 'sprint-1',
        name: 'Sprint 1',
        start: 1620000000000,
        finish: 1622000000000
      };
      
      const result = formatSprintDetailItem(sprint);
      
      expect(result).toContain(`- ${sprint.name}`);
      expect(result).toContain(`(ID: ${sprint.id})`);
      expect(result).toContain('Period:');
      expect(formatDate).toHaveBeenCalledWith(sprint.start);
      expect(formatDate).toHaveBeenCalledWith(sprint.finish);
    });
  });

  describe('formatBoardListItem', () => {
    it('should format board list item correctly', () => {
      const board = {
        id: 'board-1',
        name: 'Test Board',
        projects: [
          { id: 'project-1', name: 'Project 1' },
          { id: 'project-2', name: 'Project 2' }
        ]
      };
      
      const result = formatBoardListItem(board);
      
      expect(result).toContain(`ID: ${board.id}`);
      expect(result).toContain(`Name: ${board.name}`);
      expect(result).toContain('Projects: Project 1, Project 2');
    });
  });

  describe('formatIssueStatus', () => {
    it('should return "Resolved" for resolved issues', () => {
      const issue = {
        id: 'issue-1',
        summary: 'Test Issue',
        resolved: true
      };
      
      const result = formatIssueStatus(issue);
      
      expect(result).toBe('Resolved');
    });

    it('should return "Open" for unresolved issues', () => {
      const issue = {
        id: 'issue-1',
        summary: 'Test Issue',
        resolved: false
      };
      
      const result = formatIssueStatus(issue);
      
      expect(result).toBe('Open');
    });

    it('should return "Open" for issues with undefined resolved property', () => {
      const issue = {
        id: 'issue-1',
        summary: 'Test Issue'
      };
      
      const result = formatIssueStatus(issue);
      
      expect(result).toBe('Open');
    });
  });

  describe('createSeparator', () => {
    it('should create a separator with default length', () => {
      const result = createSeparator();
      
      expect(result).toBe('-'.repeat(50));
    });

    it('should create a separator with specified length', () => {
      const length = 20;
      const result = createSeparator(length);
      
      expect(result).toBe('-'.repeat(length));
    });
  });
}); 