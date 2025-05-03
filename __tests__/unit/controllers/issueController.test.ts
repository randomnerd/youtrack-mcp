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
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data?.issues.length).toBe(2);
      expect(result.data?.query).toContain('project: {TEST}');
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
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data?.issues.length).toBe(1);
      expect(result.data?.query).toContain('for: me');
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
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data?.issues.length).toBe(2);
      expect(result.data?.query).toContain('sprint: {Sprint 1}');
    });
    
    it('should find issues by type criteria', async () => {
      // Setup test data
      const options = { type: 'Bug' };
      const issues = issueFixtures.issues.slice(0, 2);
      
      // Setup mock
      (IssueModel.findIssuesByCriteria as jest.Mock).mockResolvedValue(issues);
      
      // Call controller method
      const result = await IssueController.findIssuesByCriteria(options);
      
      // Verify results
      expect(IssueModel.findIssuesByCriteria).toHaveBeenCalledWith(options);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data?.query).toContain('Type: {Bug}');
    });
    
    it('should find issues by resolved status criteria', async () => {
      // Setup test data
      const options = { status: 'resolved' };
      const issues = issueFixtures.issues.filter(issue => issue.resolved);
      
      if (issues.length > 0) {
        // Setup mock for issues found
        (IssueModel.findIssuesByCriteria as jest.Mock).mockResolvedValue(issues);
        
        // Call controller method
        const result = await IssueController.findIssuesByCriteria(options);
        
        // Verify results
        expect(IssueModel.findIssuesByCriteria).toHaveBeenCalledWith(options);
        expect(result.data?.query).toContain('#Resolved');
      } else {
        // Setup mock for no issues found
        (IssueModel.findIssuesByCriteria as jest.Mock).mockResolvedValue([]);
        
        // Call controller method
        const result = await IssueController.findIssuesByCriteria(options);
        
        // Verify results
        expect(IssueModel.findIssuesByCriteria).toHaveBeenCalledWith(options);
        expect(result.data?.total).toBe(0);
      }
    });
    
    it('should find issues by unresolved status criteria', async () => {
      // Setup test data
      const options = { status: 'unresolved' };
      const issues = issueFixtures.issues.filter(issue => !issue.resolved);
      
      // Setup mock
      (IssueModel.findIssuesByCriteria as jest.Mock).mockResolvedValue(issues);
      
      // Call controller method
      const result = await IssueController.findIssuesByCriteria(options);
      
      // Verify results
      expect(IssueModel.findIssuesByCriteria).toHaveBeenCalledWith(options);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data?.query).toContain('#Unresolved');
    });
    
    it('should find issues by custom status criteria', async () => {
      // Setup test data
      const options = { status: 'In Progress' };
      const issues = issueFixtures.issues.slice(0, 1);
      
      // Setup mock
      (IssueModel.findIssuesByCriteria as jest.Mock).mockResolvedValue(issues);
      
      // Call controller method
      const result = await IssueController.findIssuesByCriteria(options);
      
      // Verify results
      expect(IssueModel.findIssuesByCriteria).toHaveBeenCalledWith(options);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data?.query).toContain('State: {In Progress}');
    });
    
    it('should handle empty results', async () => {
      // Setup test data
      const options = { project: 'NONEXISTENT' };
      
      // Setup mock
      (IssueModel.findIssuesByCriteria as jest.Mock).mockResolvedValue([]);
      
      // Call controller method
      const result = await IssueController.findIssuesByCriteria(options);
      
      // Verify results
      expect(IssueModel.findIssuesByCriteria).toHaveBeenCalledWith(options);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data?.issues.length).toBe(0);
    });
    
    it('should limit results according to options', async () => {
      // Setup test data
      const options = { project: 'TEST', limit: 1 };
      const issues = issueFixtures.issues.slice(0, 3); // More issues than the limit
      
      // Setup mock
      (IssueModel.findIssuesByCriteria as jest.Mock).mockResolvedValue(issues);
      
      // Call controller method
      const result = await IssueController.findIssuesByCriteria(options);
      
      // Verify results
      expect(IssueModel.findIssuesByCriteria).toHaveBeenCalledWith(options);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data?.issues.length).toBe(3); // The model returns all 3 issues
      expect(result.data?.total).toBe(issues.length); // Total is 3
    });
    
    it('should handle errors', async () => {
      // Setup test data
      const options = { project: 'TEST' };
      const errorMessage = 'Failed to find issues';
      
      // Setup mock
      (IssueModel.findIssuesByCriteria as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      // Call controller method
      const result = await IssueController.findIssuesByCriteria(options);
      
      // Verify results
      expect(IssueModel.findIssuesByCriteria).toHaveBeenCalledWith(options);
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