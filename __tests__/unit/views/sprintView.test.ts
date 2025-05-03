import { SprintView } from '../../../src/views/sprintView';
import { sprintFixtures, issueFixtures } from '../../fixtures';
import * as YouTrackTypes from '../../../src/types/youtrack';
import { mapIssueToAIReadableText } from '../../../src/utils/issue-mapper';

// Mock test data
const mockSprints = [
  { id: 'sprint-1', name: 'Sprint 1', goal: 'Finish feature A' },
  { id: 'sprint-2', name: 'Sprint 2', goal: 'Fix critical bugs' }
];

// Mock the issue-mapper utility
jest.mock('../../../src/utils/issue-mapper', () => ({
  mapIssueToAIReadableText: jest.fn().mockImplementation((issue) => {
    return `Issue ${issue.id}: ${issue.summary}`;
  })
}));

describe('SprintView', () => {
  describe('renderDetail', () => {
    it('should render sprint details with issues', () => {
      const sprint = mockSprints[0];
      const boardId = 'board-1';
      const issues = [
        { id: 'issue-1', summary: 'Test issue 1' },
        { id: 'issue-2', summary: 'Test issue 2' }
      ] as YouTrackTypes.Issue[];
      
      const result = SprintView.renderDetail(sprint, boardId, issues);
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(2 + issues.length); // Summary + detail + issues
      expect(result.content[0].text).toContain(sprint.name);
      expect(result.content[1].text).toContain('Sprint Details');
      expect(result.content[1].text).toContain(`Issue Count: ${issues.length}`);
      
      // Check issue rendering
      issues.forEach((issue, index) => {
        expect(mapIssueToAIReadableText).toHaveBeenCalledWith(issue);
        expect(result.content[2 + index].text).toContain(`Issue ${index + 1} of ${issues.length}`);
      });
    });
    
    it('should handle rendering with no issues', () => {
      const sprint = mockSprints[0];
      const boardId = 'board-1';
      
      const result = SprintView.renderDetail(sprint, boardId);
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(3); // Summary + detail + no issues message
      expect(result.content[0].text).toContain(sprint.name);
      expect(result.content[1].text).toContain('Sprint Details');
      expect(result.content[2].text).toContain('No issues found');
    });
    
    it('should handle errors in issue processing', () => {
      const sprint = mockSprints[0];
      const boardId = 'board-1';
      const issues = [
        { id: 'issue-1', summary: 'Test issue 1' },
        { id: 'issue-2', summary: 'Test issue 2' }
      ] as YouTrackTypes.Issue[];
      
      // Mock mapIssueToAIReadableText to throw an error for the second issue
      (mapIssueToAIReadableText as jest.Mock).mockImplementation((issue) => {
        if (issue.id === 'issue-2') {
          throw new Error('Test error');
        }
        return `Issue ${issue.id}: ${issue.summary}`;
      });
      
      const result = SprintView.renderDetail(sprint, boardId, issues);
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(4); // Summary + detail + 2 issues
      expect(result.content[2].text).toContain('Issue 1 of 2');
      expect(result.content[3].text).toContain('Issue 2 of 2');
      expect(result.content[3].text).toContain('Error processing issue');
    });
  });
  
  describe('renderList', () => {
    it('should render a list of sprints with board name', () => {
      const sprints = mockSprints;
      const boardName = 'Test Board';
      
      const result = SprintView.renderList(sprints, boardName);
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain(`Sprints for board "${boardName}"`);
      sprints.forEach(sprint => {
        expect(result.content[0].text).toContain(sprint.name);
      });
    });
    
    it('should render a list of sprints without board name', () => {
      const sprints = mockSprints;
      
      const result = SprintView.renderList(sprints);
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain(`Found ${sprints.length} sprints`);
    });
    
    it('should handle empty sprints list', () => {
      const result = SprintView.renderList([]);
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Found 0 sprints');
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
          { id: 'issue-1', summary: 'Test issue 1' },
          { id: 'issue-2', summary: 'Test issue 2' }
        ]
      } as YouTrackTypes.Sprint;
      
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