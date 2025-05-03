import { IssueView } from '../../../src/views/issueView';
import { mapIssueToAIReadableText } from '../../../src/utils/issue-mapper';
import { createSeparator } from '../../../src/utils/view-utils';
import { URL } from 'url';

// Mock the dependencies
jest.mock('../../../src/utils/issue-mapper', () => ({
  mapIssueToAIReadableText: jest.fn().mockImplementation((issue) => `Issue: ${issue.id} - ${issue.summary}`)
}));

jest.mock('../../../src/utils/view-utils', () => ({
  createSeparator: jest.fn().mockReturnValue('---------------')
}));

describe('IssueView', () => {
  const mockIssue = {
    id: 'issue-1',
    summary: 'Test Issue',
    description: 'This is a test issue',
    resolved: false
  };

  const mockActivities = [
    { id: 'act-1', type: 'Comment', text: 'Test comment', author: { name: 'User 1' } }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('renderDetail', () => {
    it('should render issue details', () => {
      const result = IssueView.renderDetail(mockIssue);
      
      expect(result).toHaveProperty('content');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain(`Issue: ${mockIssue.id} - ${mockIssue.summary}`);
      expect(mapIssueToAIReadableText).toHaveBeenCalledWith(mockIssue, undefined);
    });

    it('should render issue details with activities', () => {
      const result = IssueView.renderDetail(mockIssue, mockActivities);
      
      expect(result).toHaveProperty('content');
      expect(result.content).toHaveLength(1);
      expect(mapIssueToAIReadableText).toHaveBeenCalledWith(mockIssue, mockActivities);
    });
  });

  describe('renderList', () => {
    it('should render a list of issues', () => {
      const issues = [
        mockIssue, 
        { ...mockIssue, id: 'issue-2', summary: 'Another Issue' }
      ];
      const title = 'Found 2 issues';
      
      const result = IssueView.renderList(issues, title);
      
      expect(result).toHaveProperty('content');
      expect(result.content).toHaveLength(3); // title + 2 issues
      expect(result.content[0].text).toBe(title);
      expect(mapIssueToAIReadableText).toHaveBeenCalledTimes(2);
      expect(createSeparator).toHaveBeenCalledTimes(2);
    });

    it('should handle empty issues list', () => {
      const result = IssueView.renderList([], 'Found 0 issues');
      
      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('No issues found');
      expect(mapIssueToAIReadableText).not.toHaveBeenCalled();
    });

    it('should handle error during issue mapping', () => {
      const issues = [mockIssue];
      const title = 'Found 1 issue';
      
      // Mock the mapper to throw an error for this test
      (mapIssueToAIReadableText as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Mapping error');
      });
      
      const result = IssueView.renderList(issues, title);
      
      expect(result).toHaveProperty('content');
      expect(result.content).toHaveLength(2); // title + 1 issue with error
      expect(result.content[1].text).toContain('Error processing issue');
      expect(result.content[1].text).toContain('Mapping error');
      expect(mapIssueToAIReadableText).toHaveBeenCalledTimes(1);
    });
  });

  describe('renderUpdateSuccess', () => {
    it('should render update success message', () => {
      const result = IssueView.renderUpdateSuccess('issue-1');
      
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

    it('should handle a single issue', () => {
      const uri = new URL('http://example.com/issues/issue-1');
      
      const result = IssueView.handleResourceRequest(uri, mockIssue);
      
      expect(result).toHaveProperty('contents');
      expect(result.contents[0].uri).toBe(uri.href);
      expect((result.contents[0] as { uri: string, text: string }).text).toContain(`Issue: ${mockIssue.id} - ${mockIssue.summary}`);
      expect(mapIssueToAIReadableText).toHaveBeenCalledWith(mockIssue);
    });
  });
}); 