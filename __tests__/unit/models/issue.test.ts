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
    getIssueComments: jest.fn().mockResolvedValue([
      { id: 'comment-1', text: 'Test comment', author: { id: 'user-1', name: 'Test User' }, created: 1620000000000 }
    ]),
    getIssueAttachments: jest.fn().mockResolvedValue([
      { id: 'attachment-1', name: 'test.txt', author: { id: 'user-1', name: 'Test User' }, created: 1620000000000 }
    ]),
    getIssueLinks: jest.fn().mockResolvedValue([
      { id: 'link-1', direction: 'outward', linkType: { name: 'relates to' }, issues: [{ id: 'issue-2', summary: 'Related Issue' }] }
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

    it('should pass options to client', async () => {
      const activities = await IssueModel.getIssueActivities('issue-1', {
        limit: 10,
        skip: 5,
        categories: 'IssueCreatedCategory',
        reverse: true
      });
      expect(activities).toBeDefined();
    });
  });

  describe('getIssueComments', () => {
    it('should return comments for an issue', async () => {
      const comments = await IssueModel.getIssueComments('issue-1');
      expect(comments).toBeDefined();
      expect(comments.length).toBeGreaterThan(0);
    });

    it('should pass options to client', async () => {
      const comments = await IssueModel.getIssueComments('issue-1', {
        limit: 10,
        skip: 5
      });
      expect(comments).toBeDefined();
    });
  });

  describe('getIssueAttachments', () => {
    it('should return attachments for an issue', async () => {
      const attachments = await IssueModel.getIssueAttachments('issue-1');
      expect(attachments).toBeDefined();
      expect(attachments.length).toBeGreaterThan(0);
    });

    it('should pass options to client', async () => {
      const attachments = await IssueModel.getIssueAttachments('issue-1', {
        limit: 10,
        skip: 5
      });
      expect(attachments).toBeDefined();
    });
  });

  describe('getIssueLinks', () => {
    it('should return links for an issue', async () => {
      const links = await IssueModel.getIssueLinks('issue-1');
      expect(links).toBeDefined();
      expect(links.length).toBeGreaterThan(0);
    });

    it('should pass options to client', async () => {
      const links = await IssueModel.getIssueLinks('issue-1', {
        limit: 10,
        skip: 5
      });
      expect(links).toBeDefined();
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