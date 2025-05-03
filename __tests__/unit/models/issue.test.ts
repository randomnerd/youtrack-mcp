import { IssueModel } from '../../../src/models/issue';

// Mock the entire youtrack-client module with simple returns
jest.mock('../../../src/youtrack-client', () => ({
  __esModule: true,
  default: {
    getIssue: jest.fn().mockResolvedValue({
      id: 'issue-1',
      summary: 'Test Issue',
      description: 'Test description'
    }),
    getIssueActivities: jest.fn().mockResolvedValue([
      { id: 'activity-1', $type: 'IssueCreatedActivityItem', timestamp: 1620000000000 }
    ]),
    searchIssues: jest.fn().mockResolvedValue([
      { id: 'issue-1', summary: 'Test Issue 1' },
      { id: 'issue-2', summary: 'Test Issue 2' }
    ]),
    findIssuesByCriteria: jest.fn().mockResolvedValue([
      { id: 'issue-1', summary: 'Test Issue 1' }
    ]),
    updateIssue: jest.fn().mockResolvedValue({
      id: 'issue-1',
      summary: 'Updated Issue',
      description: 'Updated description'
    })
  }
}));

describe('IssueModel', () => {
  describe('getById', () => {
    it('should return an issue by ID', async () => {
      const issue = await IssueModel.getById('issue-1');
      expect(issue).toBeDefined();
    });
  });

  describe('getIssueActivities', () => {
    it('should return activities for an issue', async () => {
      const activities = await IssueModel.getIssueActivities('issue-1');
      expect(activities).toBeDefined();
      expect(activities.length).toBeGreaterThan(0);
    });
  });

  describe('searchIssues', () => {
    it('should search issues with a query', async () => {
      const issues = await IssueModel.searchIssues('test query');
      expect(issues).toBeDefined();
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should search issues with query and options', async () => {
      const issues = await IssueModel.searchIssues('test query', { limit: 10 });
      expect(issues).toBeDefined();
      expect(issues.length).toBeGreaterThan(0);
    });
  });

  describe('findIssuesByCriteria', () => {
    it('should find issues by criteria', async () => {
      const issues = await IssueModel.findIssuesByCriteria({ project: 'TEST' });
      expect(issues).toBeDefined();
      expect(issues.length).toBeGreaterThan(0);
    });
  });

  describe('updateIssue', () => {
    it('should update an issue', async () => {
      const updatedIssue = await IssueModel.updateIssue('issue-1', {
        summary: 'Updated Issue',
        description: 'Updated description'
      });
      expect(updatedIssue).toBeDefined();
    });
  });
}); 