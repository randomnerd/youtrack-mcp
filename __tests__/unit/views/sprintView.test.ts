import { SprintView } from '../../../src/views/sprintView';
import { sprintFixtures, issueFixtures } from '../../fixtures';
import * as YouTrackTypes from '../../../src/types/youtrack';
import { formatIssueForAI, formatIssuesForAI } from '../../../src/utils/issue-formatter';
import { ControllerResult, SprintDetailResult, SprintListResult } from '../../../src/types/controllerResults';

// Mock test data
const mockSprints = [
  { id: 'sprint-1', name: 'Sprint 1', goal: 'Finish feature A', $type: 'Sprint' },
  { id: 'sprint-2', name: 'Sprint 2', goal: 'Fix critical bugs', $type: 'Sprint' }
] as YouTrackTypes.Sprint[];

// Mock the issue formatter utility
jest.mock('../../../src/utils/issue-formatter', () => ({
  formatIssueForAI: jest.fn().mockImplementation((issue) => {
    return `Issue ${issue.id}: ${issue.summary}`;
  }),
  formatIssuesForAI: jest.fn().mockImplementation((issues) => {
    return issues.map(issue => `Issue ${issue.id}: ${issue.summary}`).join('\n\n');
  })
}));

describe('SprintView', () => {
  describe('renderDetail', () => {
    it('should render sprint details with issues', () => {
      const sprint = {
        id: 'sprint-1',
        name: 'Sprint 1',
        goal: 'Finish feature A',
        $type: 'Sprint' as const,
        issues: [
          { id: 'issue-1', $type: 'Issue' as const, idReadable: 'PROJ-1', },
          { id: 'issue-2', $type: 'Issue' as const, idReadable: 'PROJ-2', }
        ]
      } as YouTrackTypes.Sprint;
      
      const controllerResult: ControllerResult<SprintDetailResult> = {
        success: true,
        data: {
          sprint,
          boardId: 'board-1'
        }
      };
      
      const result = SprintView.renderDetail(controllerResult);
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain(sprint.name);
      expect(result.content[0].text).toContain(sprint.id);
      sprint.issues?.forEach(issue => {
        expect(result.content[0].text).toContain(issue.id);
      });
    });
    
    it('should handle rendering with no issues', () => {
      const sprint = {
        id: 'sprint-1',
        name: 'Sprint 1',
        goal: 'Finish feature A',
        $type: 'Sprint' as const,
        issues: []
      } as YouTrackTypes.Sprint;
      
      const controllerResult: ControllerResult<SprintDetailResult> = {
        success: true,
        data: {
          sprint,
          boardId: 'board-1'
        }
      };
      
      const result = SprintView.renderDetail(controllerResult);
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain(sprint.name);
      expect(result.content[0].text).toContain(sprint.id);
    });
    
    it('should handle non-full issue objects', () => {
      const sprint = {
        id: 'sprint-1',
        name: 'Sprint 1',
        goal: 'Finish feature A',
        $type: 'Sprint' as const,
        issues: [
          { id: 'issue-1', idReadable: 'PROJ-1', $type: 'Issue' as const },
          { id: 'issue-2', idReadable: 'PROJ-2', $type: 'Issue' as const }
        ]
      } as YouTrackTypes.Sprint;
      
      const controllerResult: ControllerResult<SprintDetailResult> = {
        success: true,
        data: {
          sprint,
          boardId: 'board-1'
        }
      };
      
      const result = SprintView.renderDetail(controllerResult);
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain(sprint.name);
      expect(result.content[0].text).toContain(sprint.id);
      sprint.issues?.forEach(issue => {
        expect(result.content[0].text).toContain(issue.id);
        expect(result.content[0].text).toContain(issue.idReadable);
      });
    });
    
    it('should handle error case', () => {
      const controllerResult: ControllerResult<SprintDetailResult> = {
        success: false,
        error: 'Failed to fetch sprint'
      };
      
      const result = SprintView.renderDetail(controllerResult);
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Failed to fetch sprint');
    });
  });
  
  describe('renderList', () => {
    it('should render a list of sprints with board name', () => {
      const controllerResult: ControllerResult<SprintListResult> = {
        success: true,
        data: {
          sprints: mockSprints,
          total: mockSprints.length
        }
      };
      const boardName = 'Test Board';
      
      const result = SprintView.renderList(controllerResult, boardName);
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      // Just verify sprints are in the output text
      mockSprints.forEach(sprint => {
        expect(result.content[0].text).toContain(sprint.name);
      });
    });
    
    it('should render a list of sprints without board name', () => {
      const controllerResult: ControllerResult<SprintListResult> = {
        success: true,
        data: {
          sprints: mockSprints,
          total: mockSprints.length
        }
      };
      
      const result = SprintView.renderList(controllerResult);
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      // Just verify sprints are in the output text
      mockSprints.forEach(sprint => {
        expect(result.content[0].text).toContain(sprint.name);
      });
    });
    
    it('should handle empty sprints list', () => {
      const controllerResult: ControllerResult<SprintListResult> = {
        success: true,
        data: {
          sprints: [],
          total: 0
        }
      };
      
      const result = SprintView.renderList(controllerResult);
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('sprints');
      expect(result.content[0].text).toContain('0');
    });
    
    it('should handle error case', () => {
      const controllerResult: ControllerResult<SprintListResult> = {
        success: false,
        error: 'Failed to fetch sprints'
      };
      
      const result = SprintView.renderList(controllerResult);
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Failed to fetch sprints');
    });
  });
  
  describe('handleResourceRequest', () => {
    it('should handle request for a single sprint', () => {
      const sprint = mockSprints[0];
      const uri = new URL('https://example.com/sprint/123');
      const params = { boardId: 'board-1' };
      
      // Add some issues to the sprint
      const sprintWithIssues = {
        ...sprint,
        issues: [
          { id: 'issue-1', idReadable: 'PROJ-1', $type: 'Issue' as const },
          { id: 'issue-2', idReadable: 'PROJ-2', $type: 'Issue' as const }
        ]
      } as unknown as YouTrackTypes.Sprint;
      
      const result = SprintView.handleResourceRequest(uri, params, sprintWithIssues);
      
      expect(result).toBeDefined();
      expect(result.contents).toBeDefined();
      expect(result.contents.length).toBe(1);
    });
    
    it('should handle request for a sprint list', () => {
      const sprints = mockSprints;
      const uri = new URL('https://example.com/sprints');
      const params = { boardId: 'board-1' };
      const board = { id: 'board-1', name: 'Test Board' } as YouTrackTypes.Board;
      
      const result = SprintView.handleResourceRequest(uri, params, sprints, board);
      
      expect(result).toBeDefined();
      expect(result.contents).toBeDefined();
      expect(result.contents.length).toBe(1);
    });
    
    it('should handle request for a sprint list without board', () => {
      const sprints = mockSprints;
      const uri = new URL('https://example.com/sprints');
      const params = { boardId: 'board-1' };
      
      const result = SprintView.handleResourceRequest(uri, params, sprints);
      
      expect(result).toBeDefined();
      expect(result.contents).toBeDefined();
      expect(result.contents.length).toBe(1);
    });
    
    it('should handle request with no sprint data', () => {
      const uri = new URL('https://example.com/sprint/123');
      const params = { boardId: 'board-1' };
      
      const result = SprintView.handleResourceRequest(uri, params);
      
      expect(result).toBeDefined();
      expect(result.contents).toBeDefined();
      expect(result.contents.length).toBe(1);
    });
  });
}); 