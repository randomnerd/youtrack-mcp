import { issueFixtures } from '../../fixtures';
import { IssueController } from '../../../src/controllers/issueController';
import { IssueModel } from '../../../src/models/issue';
import { URL } from 'url';

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
      const issue = issueFixtures.issues.find(i => i.id === issueId);
      
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
      // Setup test data
      const issueId = '1';
      const issue = issueFixtures.issues.find(i => i.id === issueId);
      const activities = [];
      
      // Setup mocks
      (IssueModel.getById as jest.Mock).mockResolvedValue(issue);
      (IssueModel.getIssueActivities as jest.Mock).mockResolvedValue(activities);
      
      // Call controller method
      const result = await IssueController.getIssue(issueId);
      
      // Verify results
      expect(IssueModel.getById).toHaveBeenCalledWith(issueId);
      expect(IssueModel.getIssueActivities).toHaveBeenCalledWith(issueId);
      expect(result).toHaveProperty('content');
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
      expect(result).toHaveProperty('isError', true);
      expect(JSON.stringify(result.content)).toContain('No issue found');
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
      expect(result).toHaveProperty('content');
    });

    it('should handle empty search results', async () => {
      // Setup mock
      (IssueModel.searchIssues as jest.Mock).mockResolvedValue([]);
      
      // Call controller method
      const result = await IssueController.searchIssues('no matches', {});
      
      // Verify results
      expect(IssueModel.searchIssues).toHaveBeenCalledWith('no matches', {});
      expect(JSON.stringify(result.content)).toContain('No issues found');
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
      expect(result).toHaveProperty('isError', true);
      expect(JSON.stringify(result.content)).toContain(errorMessage);
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
      expect(result).toHaveProperty('content');
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
      expect(result).toHaveProperty('isError', true);
      expect(JSON.stringify(result.content)).toContain(errorMessage);
    });
  });

  describe('findIssuesByCriteria', () => {
    it('should find issues by project criteria', async () => {
      // Setup test data
      const options = { project: 'TEST' };
      const issues = issueFixtures.issues.slice(0, 2);
      
      // Setup mock
      (IssueModel.findIssuesByCriteria as jest.Mock).mockResolvedValue(issues);
      
      // Call controller method
      const result = await IssueController.findIssuesByCriteria(options);
      
      // Verify results
      expect(IssueModel.findIssuesByCriteria).toHaveBeenCalledWith(options);
      expect(result).toHaveProperty('content');
      expect(JSON.stringify(result.content)).toContain('Found 2 issues');
      expect(JSON.stringify(result.content)).toContain('project: {TEST}');
    });
    
    it('should find issues by assignee criteria', async () => {
      // Setup test data
      const options = { assignee: 'me' };
      const issues = issueFixtures.issues.slice(0, 1);
      
      // Setup mock
      (IssueModel.findIssuesByCriteria as jest.Mock).mockResolvedValue(issues);
      
      // Call controller method
      const result = await IssueController.findIssuesByCriteria(options);
      
      // Verify results
      expect(IssueModel.findIssuesByCriteria).toHaveBeenCalledWith(options);
      expect(result).toHaveProperty('content');
      expect(JSON.stringify(result.content)).toContain('Found 1 issues');
      expect(JSON.stringify(result.content)).toContain('assignee: me');
    });
    
    it('should find issues by sprint criteria', async () => {
      // Setup test data
      const options = { sprint: 'Sprint 1' };
      const issues = issueFixtures.issues.slice(1, 3);
      
      // Setup mock
      (IssueModel.findIssuesByCriteria as jest.Mock).mockResolvedValue(issues);
      
      // Call controller method
      const result = await IssueController.findIssuesByCriteria(options);
      
      // Verify results
      expect(IssueModel.findIssuesByCriteria).toHaveBeenCalledWith(options);
      expect(result).toHaveProperty('content');
      expect(JSON.stringify(result.content)).toContain('sprint: {Sprint 1}');
    });
    
    it('should find issues by type criteria', async () => {
      // Setup test data
      const options = { type: 'Bug' };
      const issues = issueFixtures.issues.slice(0, 1);
      
      // Setup mock
      (IssueModel.findIssuesByCriteria as jest.Mock).mockResolvedValue(issues);
      
      // Call controller method
      const result = await IssueController.findIssuesByCriteria(options);
      
      // Verify results
      expect(IssueModel.findIssuesByCriteria).toHaveBeenCalledWith(options);
      expect(result).toHaveProperty('content');
      expect(JSON.stringify(result.content)).toContain('Type: {Bug}');
    });
    
    it('should find issues by resolved status', async () => {
      // Setup test data
      const options = { status: 'resolved' };
      const issues = issueFixtures.issues.slice(2, 3);
      
      // Setup mock
      (IssueModel.findIssuesByCriteria as jest.Mock).mockResolvedValue(issues);
      
      // Call controller method
      const result = await IssueController.findIssuesByCriteria(options);
      
      // Verify results
      expect(IssueModel.findIssuesByCriteria).toHaveBeenCalledWith(options);
      expect(result).toHaveProperty('content');
      if (issues.length > 0) {
        expect(JSON.stringify(result.content)).toContain('#Resolved');
      } else {
        expect(JSON.stringify(result.content)).toContain('No issues found');
      }
    });
    
    it('should find issues by unresolved status', async () => {
      // Setup test data
      const options = { status: 'unresolved' };
      const issues = issueFixtures.issues.slice(0, 2);
      
      // Setup mock
      (IssueModel.findIssuesByCriteria as jest.Mock).mockResolvedValue(issues);
      
      // Call controller method
      const result = await IssueController.findIssuesByCriteria(options);
      
      // Verify results
      expect(IssueModel.findIssuesByCriteria).toHaveBeenCalledWith(options);
      expect(result).toHaveProperty('content');
      expect(JSON.stringify(result.content)).toContain('#Unresolved');
    });
    
    it('should find issues by specific status', async () => {
      // Setup test data
      const options = { status: 'In Progress' };
      const issues = issueFixtures.issues.slice(1, 2);
      
      // Setup mock
      (IssueModel.findIssuesByCriteria as jest.Mock).mockResolvedValue(issues);
      
      // Call controller method
      const result = await IssueController.findIssuesByCriteria(options);
      
      // Verify results
      expect(IssueModel.findIssuesByCriteria).toHaveBeenCalledWith(options);
      expect(result).toHaveProperty('content');
      expect(JSON.stringify(result.content)).toContain('State: {In Progress}');
    });
    
    it('should handle empty results', async () => {
      // Setup test data
      const options = { status: 'Cancelled' };
      
      // Setup mock
      (IssueModel.findIssuesByCriteria as jest.Mock).mockResolvedValue([]);
      
      // Call controller method
      const result = await IssueController.findIssuesByCriteria(options);
      
      // Verify results
      expect(IssueModel.findIssuesByCriteria).toHaveBeenCalledWith(options);
      expect(result).toHaveProperty('content');
      expect(JSON.stringify(result.content)).toContain('No issues found');
    });
    
    it('should respect limit parameter', async () => {
      // Setup test data
      const options = { limit: 1 };
      const issues = issueFixtures.issues.slice(0, 3);
      
      // Setup mock
      (IssueModel.findIssuesByCriteria as jest.Mock).mockResolvedValue(issues);
      
      // Call controller method
      const result = await IssueController.findIssuesByCriteria(options);
      
      // Verify results
      expect(IssueModel.findIssuesByCriteria).toHaveBeenCalledWith(options);
      expect(result).toHaveProperty('content');
      expect(JSON.stringify(result.content)).toContain('Showing 1 results');
    });
    
    it('should handle criteria error', async () => {
      // Setup test data
      const options = { project: 'INVALID' };
      const errorMessage = 'Invalid criteria';
      
      // Setup mock
      (IssueModel.findIssuesByCriteria as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      // Call controller method
      const result = await IssueController.findIssuesByCriteria(options);
      
      // Verify results
      expect(IssueModel.findIssuesByCriteria).toHaveBeenCalledWith(options);
      expect(result).toHaveProperty('isError', true);
      expect(JSON.stringify(result.content)).toContain(errorMessage);
    });
  });
}); 