import { IssueView } from '../../../src/views/issueView';
import { URL } from 'url';
import * as YouTrackTypes from '../../../src/types/youtrack';
import { formatYouTrackData } from '../../../src/utils/youtrack-json-formatter';
import { createIssueDetailResult, createIssueListResult, createIssueUpdateResult, createErrorResult } from '../../helpers/testHelpers';
import { ControllerResult, IssueDetailResult, IssueListResult, IssueUpdateResult } from '../../../src/types/controllerResults';

// Mock the correct dependency
jest.mock('../../../src/utils/youtrack-json-formatter', () => ({
  formatYouTrackData: jest.fn().mockImplementation((data, options) => {
    // Simple mock for testing purposes
    if (Array.isArray(data)) {
      return `Formatted ${data.length} issues`;
    }
    return `Formatted issue ${data?.id || 'unknown'}`;
  })
}));

describe('IssueView', () => {
  const mockIssue: YouTrackTypes.Issue = {
    id: 'issue-1',
    idReadable: 'PROJ-1',
    numberInProject: 1,
    summary: 'Test Issue',
    description: 'This is a test issue',
    resolved: false,
    $type: 'Issue',
    customFields: []
  };

  const mockActivities: YouTrackTypes.Activity[] = [
    {
      id: 'act-1',
      $type: 'CommentActivityItem',
      text: 'Test comment',
      author: { name: 'User 1', id: 'user-1', $type: 'User' },
      timestamp: Date.now(),
      target: { id: 'comment-1', $type: 'IssueComment' }
    } as YouTrackTypes.CommentActivityItem
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure the mock implementation is reset if modified in a test
    (formatYouTrackData as jest.Mock).mockImplementation((data, options) => {
      if (Array.isArray(data)) {
        return `Formatted ${data.length} issues`;
      }
      return `Formatted issue ${data?.id || 'unknown'}`;
    });
  });

  describe('renderDetail', () => {
    it('should render issue details', () => {
      const mockIssue = {
        id: 'issue-1',
        idReadable: 'PROJ-1',
        summary: 'Test Issue',
        description: 'This is a test issue',
        $type: 'Issue',
        customFields: []
      };
      
      const controllerResult = createIssueDetailResult(mockIssue as any);
      
      const result = IssueView.renderDetail(controllerResult);
      
      expect(result).toHaveProperty('content');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toBe(`Formatted issue ${mockIssue.id}`);
      expect(formatYouTrackData).toHaveBeenCalledWith(mockIssue, { stringify: true });
    });

    it('should render issue details with activities', () => {
      const issueWithActivities = {
        ...mockIssue,
        activities: mockActivities
      };
      const controllerResult = createIssueDetailResult(
        issueWithActivities as YouTrackTypes.IssueWithActivities, 
        mockActivities // Pass activities separately to helper, view combines them
      );
      
      const result = IssueView.renderDetail(controllerResult);
      
      expect(result).toHaveProperty('content');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toBe(`Formatted issue ${mockIssue.id}`);
      expect(formatYouTrackData).toHaveBeenCalledWith(expect.objectContaining({
        ...mockIssue,
        activities: mockActivities
      }), { stringify: true });
    });
  });

  describe('renderList', () => {
    it('should render a list of issues', () => {
      const issues: YouTrackTypes.Issue[] = [
        mockIssue, 
        { ...mockIssue, id: 'issue-2', idReadable: 'PROJ-2', numberInProject: 2, summary: 'Another Issue' }
      ];
      const title = 'Found 2 issues';
      
      const controllerResult = createIssueListResult(issues, title);
      
      const result = IssueView.renderList(controllerResult);
      
      expect(result).toHaveProperty('content');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toBe(`Formatted ${issues.length} issues`);
      expect(formatYouTrackData).toHaveBeenCalledWith(issues, { stringify: true });
    });

    it('should handle empty issues list', () => {
      const controllerResult = createIssueListResult([], 'Found 0 issues');
      
      const result = IssueView.renderList(controllerResult);
      
      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('No issues found');
      expect(formatYouTrackData).not.toHaveBeenCalled();
    });

    it('should handle error during issue mapping', () => {
      const issues = [mockIssue];
      const title = 'Found 1 issue';
      
      const controllerResult = createIssueListResult(issues, title);
      
      // Mock the formatter to throw an error for this test
      const mappingError = new Error('Mapping error');
      (formatYouTrackData as jest.Mock).mockImplementationOnce(() => {
        throw mappingError;
      });
      
      const result = IssueView.renderList(controllerResult);
      
      expect(result).toHaveProperty('content');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Error processing issue');
      expect(result.content[0].text).toContain('Mapping error');
      expect(formatYouTrackData).toHaveBeenCalledTimes(1);
    });
  });

  describe('renderUpdateSuccess', () => {
    it('should render update success message', () => {
      const controllerResult = createIssueUpdateResult('issue-1');
      
      const result = IssueView.renderUpdateSuccess(controllerResult);
      
      expect(result).toHaveProperty('content');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toBe('Issue issue-1 updated successfully!');
    });
  });

  describe('renderEmpty', () => {
    it('should render an empty message', () => {
      const message = 'No issues found';
      
      const result = IssueView.renderEmpty(message);
      
      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toBe(message);
    });
  });

  describe('renderError', () => {
    it('should render an error message', () => {
      const errorMessage = 'Failed to load issues';
      
      const result = IssueView.renderError(errorMessage);
      
      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toBe(`Error: ${errorMessage}`);
      expect(result.isError).toBe(true);
    });
  });

  describe('handleResourceRequest', () => {
    it('should handle undefined issue', () => {
      const uri = new URL('http://example.com/issues');
      
      const result = IssueView.handleResourceRequest(uri, undefined);
      
      expect(result).toHaveProperty('contents');
      expect((result.contents[0] as { uri: string, text: string }).text).toContain('Please specify an issue ID');
    });

    it('should handle a single issue successfully', () => {
      jest.clearAllMocks();
      
      const uri = new URL('http://example.com/issues/test-1');
      const testIssue = {
        id: 'test-1',
        idReadable: 'TEST-1',
        numberInProject: 123,
        summary: 'Test issue',
        description: 'Test description',
        $type: 'Issue' as const,
        customFields: []
      };
      
      const result = IssueView.handleResourceRequest(uri, testIssue);
      
      expect(result).toHaveProperty('contents');
      expect(result.contents[0].uri).toBe(uri.href);
      expect((result.contents[0] as { uri: string, text: string }).text).toBe(`Formatted issue ${testIssue.id}`);
      expect(formatYouTrackData).toHaveBeenCalledWith(testIssue, { stringify: true });
    });
  });
}); 