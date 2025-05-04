import { issueFixtures } from '../../fixtures';
import { IssueController } from '../../../src/controllers/issueController';
import { IssueModel } from '../../../src/models/issue';
import { URL } from 'url';
import { Issue, IssueWithActivities } from '../../../src/types/youtrack';

// Mock the IssueModel with all required methods
jest.mock('../../../src/models/issue', () => ({
  IssueModel: {
    getById: jest.fn(),
    getIssueActivities: jest.fn(),
    searchIssues: jest.fn(),
    findIssuesByCriteria: jest.fn(),
    updateIssue: jest.fn()
  }
}));

describe('Issue Controller', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('handleResourceRequest', () => {
    it('should return a specific issue', async () => {
      // Setup test data
      const issueId = '1';
      const issue = issueFixtures.issues.find(i => i.id === issueId) || createMockIssue(issueId);
      
      // Setup mock
      (IssueModel.getById as jest.Mock).mockResolvedValue(issue);
      
      // Call controller method with URL object and params
      const uri = new URL(`youtrack://issues/${issueId}`);
      const result = await IssueController.handleResourceRequest(uri, {
        params: { issueId }
      });
      
      // Verify results
      expect(IssueModel.getById).toHaveBeenCalledWith(issueId);
      expect(result).toHaveProperty('contents');
    });

    it('should handle issue not found', async () => {
      // Setup test data
      const issueId = 'nonexistent';
      
      // Setup mock
      (IssueModel.getById as jest.Mock).mockResolvedValue(null);
      
      // Call controller method
      const uri = new URL(`youtrack://issues/${issueId}`);
      const result = await IssueController.handleResourceRequest(uri, {
        params: { issueId }
      });
      
      // Verify results
      expect(IssueModel.getById).toHaveBeenCalledWith(issueId);
      expect(JSON.stringify(result)).toContain('No issue found');
    });

    it('should handle errors', async () => {
      // Setup test data
      const issueId = '1';
      const errorMessage = 'Failed to fetch issue';
      
      // Setup mock
      (IssueModel.getById as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      // Call controller method
      const uri = new URL(`youtrack://issues/${issueId}`);
      const result = await IssueController.handleResourceRequest(uri, {
        params: { issueId }
      });
      
      // Verify results
      expect(IssueModel.getById).toHaveBeenCalledWith(issueId);
      expect(JSON.stringify(result)).toContain('Error:');
    });
  });

  describe('getIssue', () => {
    it('should return issue details', async () => {
      // Setup test data with a mock issue instead of using the fixture
      const issueId = 'TEST-1';
      const issue: IssueWithActivities = createMockIssue(issueId);
      const activities = [];
      
      // Setup mocks
      (IssueModel.getById as jest.Mock).mockResolvedValue(issue);
      (IssueModel.getIssueActivities as jest.Mock).mockResolvedValue(activities);
      
      // Call controller method
      const result = await IssueController.getIssue(issueId);
      
      // Verify results
      expect(IssueModel.getById).toHaveBeenCalledWith(issueId);
      expect(IssueModel.getIssueActivities).toHaveBeenCalledWith(issueId);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('issue');
    });
    
    it('should handle issue not found', async () => {
      // Setup test data
      const issueId = 'nonexistent';
      
      // Setup mocks
      (IssueModel.getById as jest.Mock).mockResolvedValue(null);
      (IssueModel.getIssueActivities as jest.Mock).mockResolvedValue([]);
      
      // Call controller method
      const result = await IssueController.getIssue(issueId);
      
      // Verify results
      expect(IssueModel.getById).toHaveBeenCalledWith(issueId);
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('No issue found');
    });
  });

  describe('searchIssues', () => {
    it('should search for issues', async () => {
      // Setup test data
      const query = 'test query';
      const options = { limit: 10 };
      const issues = issueFixtures.issues.slice(0, 2);
      
      // Setup mock
      (IssueModel.searchIssues as jest.Mock).mockResolvedValue(issues);
      
      // Call controller method
      const result = await IssueController.searchIssues(query, options);
      
      // Verify results
      expect(IssueModel.searchIssues).toHaveBeenCalledWith(query, options);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('issues');
      expect(result.data?.issues.length).toBe(2);
    });

    it('should handle empty search results', async () => {
      // Setup mock
      (IssueModel.searchIssues as jest.Mock).mockResolvedValue([]);
      
      // Call controller method
      const result = await IssueController.searchIssues('no matches', {});
      
      // Verify results
      expect(IssueModel.searchIssues).toHaveBeenCalledWith('no matches', {});
      expect(result).toHaveProperty('success', true);
      expect(result.data?.issues.length).toBe(0);
      expect(result.data?.total).toBe(0);
    });

    it('should handle search errors', async () => {
      // Setup test data
      const errorMessage = 'Search failed';
      
      // Setup mock
      (IssueModel.searchIssues as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      // Call controller method
      const result = await IssueController.searchIssues('test', {});
      
      // Verify results
      expect(IssueModel.searchIssues).toHaveBeenCalledWith('test', {});
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain(errorMessage);
    });
  });

  describe('updateIssue', () => {
    it('should update an issue', async () => {
      // Setup test data
      const issueId = '1';
      const updates = { summary: 'Updated summary', description: 'Updated description' };
      const updatedIssue = { ...issueFixtures.issues.find(i => i.id === issueId), ...updates };
      
      // Setup mock
      (IssueModel.updateIssue as jest.Mock).mockResolvedValue(updatedIssue);
      
      // Call controller method
      const result = await IssueController.updateIssue(issueId, updates);
      
      // Verify results
      expect(IssueModel.updateIssue).toHaveBeenCalledWith(issueId, updates);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data?.issueId).toBe(issueId);
      expect(result.data?.updated).toBe(true);
    });

    it('should handle update errors', async () => {
      // Setup test data
      const issueId = '1';
      const updates = { summary: 'Updated summary' };
      const errorMessage = 'Update failed';
      
      // Setup mock
      (IssueModel.updateIssue as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      // Call controller method
      const result = await IssueController.updateIssue(issueId, updates);
      
      // Verify results
      expect(IssueModel.updateIssue).toHaveBeenCalledWith(issueId, updates);
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain(errorMessage);
    });
  });

  describe('findIssuesByCriteria', () => {
    it('should find issues by criteria', async () => {
      // Setup test data
      const options = { project: 'TEST', status: 'Open', limit: 10, skip: 0 };
      const issues = issueFixtures.issues.slice(0, 2);
      
      // Setup mock
      (IssueModel.findIssuesByCriteria as jest.Mock).mockResolvedValue(issues);
      
      // Call controller method
      const result = await IssueController.findIssuesByCriteria(options);
      
      // Verify results
      expect(IssueModel.findIssuesByCriteria).toHaveBeenCalledWith(options);
      expect(result).toHaveProperty('success', true);
      expect(result.data?.issues.length).toBe(2);
      expect(result.data?.query).toContain('project: {TEST}');
      expect(result.data?.query).toContain('State: {Open}');
    });

    // Tests for special status values
    it('should handle resolved status special case', async () => {
      const options = { status: 'resolved' };
      const issues = [];
      
      (IssueModel.findIssuesByCriteria as jest.Mock).mockResolvedValue(issues);
      
      const result = await IssueController.findIssuesByCriteria(options);
      
      expect(result.data?.query).toContain('#Resolved');
    });

    it('should handle unresolved status special case', async () => {
      const options = { status: 'unresolved' };
      const issues = [];
      
      (IssueModel.findIssuesByCriteria as jest.Mock).mockResolvedValue(issues);
      
      const result = await IssueController.findIssuesByCriteria(options);
      
      expect(result.data?.query).toContain('#Unresolved');
    });
  });

  // Add tests for untested methods
  describe('getIssueComments', () => {
    beforeEach(() => {
      // Add the missing mock method
      (IssueModel as any).getIssueComments = jest.fn();
    });

    it('should return issue comments', async () => {
      // Setup test data
      const issueId = 'TEST-1';
      const comments = [
        { id: 'comment1', text: 'First comment' },
        { id: 'comment2', text: 'Second comment' }
      ];
      
      // Setup mock
      (IssueModel.getIssueComments as jest.Mock).mockResolvedValue(comments);
      
      // Call controller method
      const result = await IssueController.getIssueComments(issueId, { limit: 10, skip: 0 });
      
      // Verify results
      expect(IssueModel.getIssueComments).toHaveBeenCalledWith(issueId, { limit: 10, skip: 0 });
      expect(result).toHaveProperty('success', true);
      expect(result.data?.comments).toEqual(comments);
      expect(result.data?.total).toBe(2);
      expect(result.data?.issueId).toBe(issueId);
    });

    it('should handle errors when fetching comments', async () => {
      // Setup test data
      const issueId = 'TEST-1';
      const errorMessage = 'Failed to fetch comments';
      
      // Setup mock
      (IssueModel.getIssueComments as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      // Call controller method
      const result = await IssueController.getIssueComments(issueId);
      
      // Verify results
      expect(IssueModel.getIssueComments).toHaveBeenCalledWith(issueId, undefined);
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain(errorMessage);
    });
  });

  describe('getIssueAttachments', () => {
    beforeEach(() => {
      // Add the missing mock method
      (IssueModel as any).getIssueAttachments = jest.fn();
    });

    it('should return issue attachments', async () => {
      // Setup test data
      const issueId = 'TEST-1';
      const attachments = [
        { id: 'attach1', name: 'file1.txt', size: 1024 },
        { id: 'attach2', name: 'file2.pdf', size: 2048 }
      ];
      
      // Setup mock
      (IssueModel.getIssueAttachments as jest.Mock).mockResolvedValue(attachments);
      
      // Call controller method
      const result = await IssueController.getIssueAttachments(issueId, { limit: 10, skip: 0 });
      
      // Verify results
      expect(IssueModel.getIssueAttachments).toHaveBeenCalledWith(issueId, { limit: 10, skip: 0 });
      expect(result).toHaveProperty('success', true);
      expect(result.data?.attachments).toEqual(attachments);
      expect(result.data?.total).toBe(2);
      expect(result.data?.issueId).toBe(issueId);
    });

    it('should handle errors when fetching attachments', async () => {
      // Setup test data
      const issueId = 'TEST-1';
      const errorMessage = 'Failed to fetch attachments';
      
      // Setup mock
      (IssueModel.getIssueAttachments as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      // Call controller method
      const result = await IssueController.getIssueAttachments(issueId);
      
      // Verify results
      expect(IssueModel.getIssueAttachments).toHaveBeenCalledWith(issueId, undefined);
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain(errorMessage);
    });
  });

  describe('getIssueLinks', () => {
    beforeEach(() => {
      // Add the missing mock method
      (IssueModel as any).getIssueLinks = jest.fn();
    });

    it('should return issue links', async () => {
      // Setup test data
      const issueId = 'TEST-1';
      const links = [
        { id: 'link1', type: 'relates to', target: 'TEST-2' },
        { id: 'link2', type: 'blocks', target: 'TEST-3' }
      ];
      
      // Setup mock
      (IssueModel.getIssueLinks as jest.Mock).mockResolvedValue(links);
      
      // Call controller method
      const result = await IssueController.getIssueLinks(issueId, { limit: 10, skip: 0 });
      
      // Verify results
      expect(IssueModel.getIssueLinks).toHaveBeenCalledWith(issueId, { limit: 10, skip: 0 });
      expect(result).toHaveProperty('success', true);
      expect(result.data?.links).toEqual(links);
      expect(result.data?.total).toBe(2);
      expect(result.data?.issueId).toBe(issueId);
    });

    it('should handle errors when fetching links', async () => {
      // Setup test data
      const issueId = 'TEST-1';
      const errorMessage = 'Failed to fetch links';
      
      // Setup mock
      (IssueModel.getIssueLinks as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      // Call controller method
      const result = await IssueController.getIssueLinks(issueId);
      
      // Verify results
      expect(IssueModel.getIssueLinks).toHaveBeenCalledWith(issueId, undefined);
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain(errorMessage);
    });
  });

  describe('getIssueActivities separately', () => {
    it('should return issue activities with options', async () => {
      // Setup test data
      const issueId = 'TEST-1';
      const activities = [
        { id: 'activity1', timestamp: 1620000000000, author: { name: 'User 1' } },
        { id: 'activity2', timestamp: 1621000000000, author: { name: 'User 2' } }
      ];
      const options = { 
        limit: 10, 
        skip: 0,
        categories: 'comments,links',
        reverse: true
      };
      
      // Setup mock
      (IssueModel.getIssueActivities as jest.Mock).mockResolvedValue(activities);
      
      // Call controller method
      const result = await IssueController.getIssueActivities(issueId, options);
      
      // Verify results
      expect(IssueModel.getIssueActivities).toHaveBeenCalledWith(issueId, options);
      expect(result).toHaveProperty('success', true);
      expect(result.data?.activities).toEqual(activities);
      expect(result.data?.total).toBe(2);
      expect(result.data?.issueId).toBe(issueId);
    });

    it('should handle errors when fetching activities separately', async () => {
      // Setup test data
      const issueId = 'TEST-1';
      const errorMessage = 'Failed to fetch activities';
      
      // Setup mock
      (IssueModel.getIssueActivities as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      // Call controller method
      const result = await IssueController.getIssueActivities(issueId);
      
      // Verify results
      expect(IssueModel.getIssueActivities).toHaveBeenCalledWith(issueId, undefined);
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain(errorMessage);
    });
  });
});

// Helper function to create a mock issue
function createMockIssue(id: string): IssueWithActivities {
  return {
    id,
    summary: `Test Issue ${id}`,
    description: 'This is a test issue created for unit tests',
    resolved: false,
    created: Date.now(),
    updated: Date.now(),
    idReadable: `TEST-${id}`,
    numberInProject: parseInt(id, 10) || 1,
    $type: 'Issue',
    reporter: {
      login: 'test-user',
      fullName: 'Test User',
      id: 'user-1',
      name: 'Test User',
      $type: 'User'
    },
    customFields: [],
    project: {
      id: 'project-1',
      name: 'Test Project',
      shortName: 'TEST',
      $type: 'Project'
    },
    activities: []
  };
} 