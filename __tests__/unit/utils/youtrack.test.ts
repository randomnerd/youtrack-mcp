import { YouTrack } from '../../../src/utils/youtrack';
import mockAxios, { setupYouTrackApiMocks, resetMocks } from '../../mocks/youtrack-api.mock';
import { boardFixtures, issueFixtures, sprintFixtures, projectFixtures } from '../../fixtures';
import { AxiosError } from 'axios';
import { NotificationsUserProfile } from '../../../src/types/youtrack';

describe('YouTrack API Client', () => {
  const baseUrl = 'http://youtrack-test.example.com/api';
  const token = 'test-token';
  let youtrackClient: YouTrack;

  beforeEach(() => {
    resetMocks();
    setupYouTrackApiMocks(baseUrl);
    youtrackClient = new YouTrack(baseUrl, token);
    // Add specific mocks for the test cases
    mockAxios.onGet(`${baseUrl}/agiles`).reply(200, boardFixtures.listBoards);
    mockAxios.onGet(new RegExp(`${baseUrl}/issues\\?.*`)).reply(200, issueFixtures.listIssues);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Add a test to verify we catch unmocked endpoints
  describe('Unmocked endpoint handling', () => {
    it('should throw an error for unmocked endpoints instead of making real API calls', async () => {
      // Define a custom method to access a clearly non-existent endpoint
      const callUnmockedEndpoint = async () => {
        // Cast to any to access private method
        return (youtrackClient as any).request('/non-existent-endpoint/test-123', {});
      };
      
      // Any unmocked endpoint should throw an error with our specific message
      await expect(callUnmockedEndpoint()).rejects.toThrow(/Endpoint not mocked/);
      
      // Verify a request was attempted to our mock API
      expect(mockAxios.history.get.length).toBeGreaterThan(0);
    });
  });

  describe('Field builder methods', () => {
    it('should add fields to issue field builder', () => {
      // Add a single field
      youtrackClient.addIssueFields('customField');
      expect(youtrackClient.issueFields).toContain('customField');
      
      // Add multiple fields
      youtrackClient.addIssueFields(['state', 'tags']);
      expect(youtrackClient.issueFields).toContain('state');
      expect(youtrackClient.issueFields).toContain('tags');
    });
    
    it('should add fields to sprint field builder', () => {
      // Add a single field
      youtrackClient.addSprintFields('goal');
      expect(youtrackClient.sprintFields).toContain('goal');
      
      // Add multiple fields
      youtrackClient.addSprintFields(['status', 'createdBy']);
      expect(youtrackClient.sprintFields).toContain('status');
      expect(youtrackClient.sprintFields).toContain('createdBy');
    });
    
    it('should add fields to agile field builder', () => {
      // Add a single field
      youtrackClient.addAgileFields('owner');
      expect(youtrackClient.agileFields).toContain('owner');
      
      // Add multiple fields
      youtrackClient.addAgileFields(['status', 'sprints']);
      expect(youtrackClient.agileFields).toContain('status');
      expect(youtrackClient.agileFields).toContain('sprints');
    });
    
    it('should set issue fields replacing existing ones', () => {
      const originalFields = youtrackClient.issueFields;
      
      // Set new fields
      youtrackClient.setIssueFields(['id', 'summary', 'customField']);
      
      // Verify fields were replaced
      expect(youtrackClient.issueFields).not.toEqual(originalFields);
      expect(youtrackClient.issueFields).toContain('id');
      expect(youtrackClient.issueFields).toContain('summary');
      expect(youtrackClient.issueFields).toContain('customField');
    });
    
    it('should set sprint fields replacing existing ones', () => {
      const originalFields = youtrackClient.sprintFields;
      
      // Set new fields
      youtrackClient.setSprintFields(['id', 'name', 'goal']);
      
      // Verify fields were replaced
      expect(youtrackClient.sprintFields).not.toEqual(originalFields);
      expect(youtrackClient.sprintFields).toContain('id');
      expect(youtrackClient.sprintFields).toContain('name');
      expect(youtrackClient.sprintFields).toContain('goal');
    });
    
    it('should set agile fields replacing existing ones', () => {
      const originalFields = youtrackClient.agileFields;
      
      // Set new fields
      youtrackClient.setAgileFields(['id', 'name', 'owner']);
      
      // Verify fields were replaced
      expect(youtrackClient.agileFields).not.toEqual(originalFields);
      expect(youtrackClient.agileFields).toContain('id');
      expect(youtrackClient.agileFields).toContain('name');
      expect(youtrackClient.agileFields).toContain('owner');
    });
  });

  describe('Error handling and retry logic', () => {
    it('should retry on server errors (5XX)', async () => {
      // Create a counter to track how many times the endpoint is called
      let callCount = 0;
      
      // Mock a server error that succeeds after the second try
      mockAxios.onGet(`${baseUrl}/test-retry`).reply(() => {
        callCount++;
        if (callCount < 2) {
          return [500, 'Server Error'];
        }
        return [200, { success: true }];
      });
      
      // Create client with lower timeout for faster tests
      const client = new YouTrack(baseUrl, token, false, 100, 3);
      
      // Cast to any to access private method
      const result = await (client as any).request('/test-retry');
      
      expect(result).toEqual({ success: true });
      expect(callCount).toBe(2); // Verify it was called twice
    });
    
    it('should retry on rate limit errors (429)', async () => {
      let callCount = 0;
      
      mockAxios.onGet(`${baseUrl}/test-rate-limit`).reply(() => {
        callCount++;
        if (callCount < 2) {
          return [429, 'Too Many Requests'];
        }
        return [200, { success: true }];
      });
      
      const client = new YouTrack(baseUrl, token, false, 100, 3);
      const result = await (client as any).request('/test-rate-limit');
      
      expect(result).toEqual({ success: true });
      expect(callCount).toBe(2);
    });
    
    it('should not retry on client errors (4XX except 429)', async () => {
      let callCount = 0;
      
      mockAxios.onGet(`${baseUrl}/test-client-error`).reply(() => {
        callCount++;
        return [400, 'Bad Request'];
      });
      
      const client = new YouTrack(baseUrl, token, false, 100, 3);
      
      await expect((client as any).request('/test-client-error')).rejects.toThrow('YouTrack API Error (400)');
      expect(callCount).toBe(1); // Verify it was only called once
    });
    
    it('should stop retrying after max retries', async () => {
      let callCount = 0;
      
      mockAxios.onGet(`${baseUrl}/test-max-retries`).reply(() => {
        callCount++;
        return [500, 'Persistent Server Error'];
      });
      
      // Set max retries to 2
      const client = new YouTrack(baseUrl, token, false, 100, 2);
      
      await expect((client as any).request('/test-max-retries')).rejects.toThrow('YouTrack API Error (500)');
      expect(callCount).toBe(3); // Initial + 2 retries = 3 calls
    });
  });

  describe('Board methods', () => {
    it('should list all boards', async () => {
      const boards = await youtrackClient.listBoards();
      expect(boards).toEqual(boardFixtures.listBoards);
      expect(mockAxios.history.get.length).toBe(1);
      expect(mockAxios.history.get[0].url).toContain('/agiles');
    });

    it('should get a specific board by ID', async () => {
      // This is mocked by setupYouTrackApiMocks already
      const boardId = '1';
      mockAxios.onGet(`${baseUrl}/agiles/${boardId}`).reply(200, boardFixtures.boards.find(b => b.id === boardId));
      
      const board = await youtrackClient.getBoard(boardId);
      
      expect(board).toEqual(boardFixtures.boards.find(b => b.id === boardId));
      expect(mockAxios.history.get.length).toBe(1);
      expect(mockAxios.history.get[0].url).toContain(`/agiles/${boardId}`);
    });

    it('should handle error when board is not found', async () => {
      const boardId = 'nonexistent';
      await expect(youtrackClient.getBoard(boardId)).rejects.toThrow();
    });
  });

  describe('Issue methods', () => {
    it('should get an issue by ID', async () => {
      const issueId = '1';
      mockAxios.onGet(`${baseUrl}/issues/${issueId}`).reply(200, issueFixtures.issues.find(i => i.id === issueId));
      
      const issue = await youtrackClient.getIssue(issueId);
      
      expect(issue).toEqual(issueFixtures.issues.find(i => i.id === issueId));
      expect(mockAxios.history.get.length).toBe(1);
      expect(mockAxios.history.get[0].url).toContain(`/issues/${issueId}`);
    });

    it('should search for issues', async () => {
      const query = 'project: TEST #Unresolved';
      
      // Mock the specific search query
      mockAxios.onGet(new RegExp(`${baseUrl}/issues\\?.*`)).reply(function(config) {
        expect(config.params.q).toBe(query);
        return [200, issueFixtures.listIssues];
      });
      
      const issues = await youtrackClient.searchIssues(query);
      
      expect(issues).toEqual(issueFixtures.listIssues);
      expect(mockAxios.history.get.length).toBe(1);
      expect(mockAxios.history.get[0].url).toContain('/issues');
    });

    it('should update an issue', async () => {
      const issueId = '1';
      const updates = {
        summary: 'Updated test issue',
        description: 'Updated description',
        resolved: true
      };
      
      mockAxios.onPost(`${baseUrl}/issues/${issueId}`).reply(200, {
        ...issueFixtures.issues.find(i => i.id === issueId),
        ...updates
      });
      
      const updatedIssue = await youtrackClient.updateIssue(issueId, updates);
      
      expect(updatedIssue.summary).toBe(updates.summary);
      expect(updatedIssue.description).toBe(updates.description);
      expect(updatedIssue.resolved).toBe(updates.resolved);
      expect(mockAxios.history.post.length).toBe(1);
      expect(mockAxios.history.post[0].url).toContain(`/issues/${issueId}`);
    });

    it('should create an issue', async () => {
      const projectId = 'project-1';
      const issueData = {
        summary: 'New test issue',
        description: 'This is a test issue',
        customFields: [
          { name: 'Priority', value: 'High' }
        ]
      };
      
      mockAxios.onPost(`${baseUrl}/issues`).reply(200, {
        id: 'new-issue-1',
        ...issueData
      });
      
      const createdIssue = await youtrackClient.createIssue(projectId, issueData);
      
      expect(createdIssue).toHaveProperty('id');
      expect(createdIssue.summary).toBe(issueData.summary);
      expect(createdIssue.description).toBe(issueData.description);
      expect(mockAxios.history.post.length).toBe(1);
      expect(mockAxios.history.post[0].url).toContain('/issues');
      // Accept either string or object with id for project
      const sentData = JSON.parse(mockAxios.history.post[0].data);
      expect(sentData).toHaveProperty('project');
      // If it's an object, check the id property
      if (typeof sentData.project === 'object') {
        expect(sentData.project.id).toBe(projectId);
      } else {
        expect(sentData.project).toBe(projectId);
      }
    });

    it('should get issue comments', async () => {
      const issueId = '1';
      const mockComments = [
        { id: 'comment-1', text: 'Test comment 1', author: { id: 'user-1', login: 'user1' }, created: 1620000000000 },
        { id: 'comment-2', text: 'Test comment 2', author: { id: 'user-2', login: 'user2' }, created: 1620100000000 }
      ];
      
      mockAxios.onGet(`${baseUrl}/issues/${issueId}/comments`).reply(200, mockComments);
      
      const comments = await youtrackClient.getIssueComments(issueId);
      
      expect(comments).toEqual(mockComments);
      expect(mockAxios.history.get.length).toBe(1);
      expect(mockAxios.history.get[0].url).toContain(`/issues/${issueId}/comments`);
    });

    it('should add a comment to an issue', async () => {
      const issueId = '1';
      const commentText = 'This is a test comment';
      const mockComment = {
        id: 'new-comment-1',
        text: commentText,
        author: { id: 'user-1', login: 'user1' },
        created: Date.now()
      };
      
      mockAxios.onPost(`${baseUrl}/issues/${issueId}/comments`).reply(200, mockComment);
      
      const comment = await youtrackClient.addIssueComment(issueId, commentText);
      
      // Don't compare the created timestamp as it's dynamic
      expect(comment.id).toBe(mockComment.id);
      expect(comment.text).toBe(mockComment.text);
      expect(comment.author).toEqual(mockComment.author);
      expect(mockAxios.history.post.length).toBe(1);
      expect(mockAxios.history.post[0].url).toContain(`/issues/${issueId}/comments`);
      expect(JSON.parse(mockAxios.history.post[0].data).text).toBe(commentText);
    });

    it('should get issue links', async () => {
      const issueId = '1';
      const mockLinks = [
        { id: 'link-1', direction: 'outward', linkType: { id: 'type-1', localizedName: 'Relates to' } },
        { id: 'link-2', direction: 'inward', linkType: { id: 'type-2', localizedName: 'Is blocked by' } }
      ];
      
      mockAxios.onGet(`${baseUrl}/issues/${issueId}/links`).reply(200, mockLinks);
      
      const links = await youtrackClient.getIssueLinks(issueId);
      
      expect(links).toEqual(mockLinks);
      expect(mockAxios.history.get.length).toBe(1);
      expect(mockAxios.history.get[0].url).toContain(`/issues/${issueId}/links`);
    });

    it('should find issues by criteria', async () => {
      const criteria = {
        project: 'TEST',
        assignee: 'me',
        status: 'Open',
        limit: 10
      };
      
      mockAxios.onGet(new RegExp(`${baseUrl}/issues\\?.*`)).reply(function(config) {
        expect(config.params.q).toContain('project:');
        expect(config.params.q).toContain('assignee:');
        expect(config.params.$top).toBe(criteria.limit);
        return [200, issueFixtures.listIssues];
      });
      
      const issues = await youtrackClient.findIssuesByCriteria(criteria);
      
      expect(issues).toEqual(issueFixtures.listIssues);
      expect(mockAxios.history.get.length).toBe(1);
    });
    
    it('should get issue attachments', async () => {
      const issueId = '1';
      const mockAttachments = [
        { id: 'attachment-1', name: 'test.txt', url: 'http://example.com/attachments/test.txt' },
        { id: 'attachment-2', name: 'image.png', url: 'http://example.com/attachments/image.png' }
      ];
      
      mockAxios.onGet(`${baseUrl}/issues/${issueId}/attachments`).reply(200, mockAttachments);
      
      const attachments = await youtrackClient.getIssueAttachments(issueId);
      
      expect(attachments).toEqual(mockAttachments);
      expect(mockAxios.history.get.length).toBe(1);
      expect(mockAxios.history.get[0].url).toContain(`/issues/${issueId}/attachments`);
    });
    
    it('should add an attachment to an issue', async () => {
      const issueId = '1';
      const fileName = 'test.png';
      const fileContent = new Blob(['test content'], { type: 'image/png' });
      const mockAttachment = {
        id: 'new-att-1',
        name: fileName,
        size: 12,
        author: { id: 'user-1', login: 'user1' }
      };
      
      mockAxios.onPost(`${baseUrl}/issues/${issueId}/attachments`).reply(200, mockAttachment);
      
      const attachment = await youtrackClient.addIssueAttachment(issueId, fileName, fileContent, 'image/png');
      
      expect(attachment).toEqual(mockAttachment);
      expect(mockAxios.history.post.length).toBe(1);
      expect(mockAxios.history.post[0].url).toContain(`/issues/${issueId}/attachments`);
    });
    
    it('should get issue activities', async () => {
      const issueId = '1';
      const mockActivities = [
        { id: 'activity-1', $type: 'IssueCreatedActivityItem', timestamp: 1620000000000, author: { id: 'user-1', login: 'user1' } },
        { id: 'activity-2', $type: 'CustomFieldActivityItem', timestamp: 1620100000000, author: { id: 'user-2', login: 'user2' } }
      ];
      
      mockAxios.onGet(`${baseUrl}/issues/${issueId}/activities`).reply(200, mockActivities);
      
      const activities = await youtrackClient.getIssueActivities(issueId);
      
      expect(activities).toEqual(mockActivities);
      expect(mockAxios.history.get.length).toBe(1);
      expect(mockAxios.history.get[0].url).toContain(`/issues/${issueId}/activities`);
    });
    
    it('should get issue activities with pagination', async () => {
      const issueId = '1';
      const mockActivitiesPage = {
        $type: 'CursorPage',
        activities: [
          { id: 'activity-1', $type: 'IssueCreatedActivityItem', timestamp: 1620000000000 }
        ],
        hasNext: true,
        hasPrev: false,
        nextCursor: 'next-cursor-123'
      };
      
      mockAxios.onGet(`${baseUrl}/issues/${issueId}/activitiesPage`).reply(200, mockActivitiesPage);
      
      const activitiesPage = await youtrackClient.getIssueActivitiesPage(issueId);
      
      expect(activitiesPage).toEqual(mockActivitiesPage);
      expect(mockAxios.history.get.length).toBe(1);
      expect(mockAxios.history.get[0].url).toContain(`/issues/${issueId}/activitiesPage`);
    });
  });

  describe('Sprint methods', () => {
    it('should get a sprint by board ID and sprint ID', async () => {
      const boardId = '1';
      const sprintId = '101';
      
      // Explicitly mock this response
      mockAxios.onGet(`${baseUrl}/agiles/${boardId}/sprints/${sprintId}`).reply(200, sprintFixtures.sprints.find(s => s.id === sprintId));
      
      const sprint = await youtrackClient.getSprint(boardId, sprintId);
      
      expect(sprint).toEqual(sprintFixtures.sprints.find(s => s.id === sprintId));
      expect(mockAxios.history.get.length).toBe(1);
      expect(mockAxios.history.get[0].url).toContain(`/agiles/${boardId}/sprints/${sprintId}`);
    });

    it('should find sprints by criteria', async () => {
      const boardId = '1';
      
      // Explicitly mock this response
      mockAxios.onGet(`${baseUrl}/agiles/${boardId}/sprints`).reply(200, sprintFixtures.sprintsByBoard[boardId]);
      
      const sprints = await youtrackClient.findSprints({ boardId });
      
      expect(sprints).toEqual(sprintFixtures.sprintsByBoard[boardId]);
      expect(mockAxios.history.get.length).toBe(1);
      expect(mockAxios.history.get[0].url).toContain(`/agiles/${boardId}/sprints`);
    });
  });
  
  describe('Additional API methods', () => {
    it('should list bundles', async () => {
      const bundleType = 'state';
      const mockBundles = [
        { id: 'bundle-1', name: 'State Bundle', type: 'state' },
        { id: 'bundle-2', name: 'Another State Bundle', type: 'state' }
      ];
      
      mockAxios.onGet(`${baseUrl}/admin/customFieldSettings/bundles?fields=id,name,$type&$type=${bundleType}`).reply(200, mockBundles);
      
      const bundles = await youtrackClient.listBundles(bundleType);
      
      expect(bundles).toEqual(mockBundles);
      expect(mockAxios.history.get.length).toBe(1);
    });
    
    it('should get a specific bundle', async () => {
      const bundleId = 'bundle-1';
      const mockBundle = { 
        id: bundleId, 
        name: 'State Bundle', 
        type: 'state',
        values: [
          { id: 'element-1', name: 'Element 1' },
          { id: 'element-2', name: 'Element 2' }
        ] 
      };
      
      mockAxios.onGet(`${baseUrl}/admin/customFieldSettings/bundles/${bundleId}`).reply(200, mockBundle);
      
      const bundle = await youtrackClient.getBundle(bundleId);
      
      expect(bundle).toEqual(mockBundle);
      expect(mockAxios.history.get.length).toBe(1);
      expect(mockAxios.history.get[0].url).toContain(`/admin/customFieldSettings/bundles/${bundleId}`);
    });
    
    it('should get user notification settings', async () => {
      const userId = 'user-1';
      const mockSettings = {
        id: userId,
        emailNotificationsEnabled: true,
        jabberNotificationsEnabled: false,
        notifyOnOwnChanges: false,
        mentionNotificationsEnabled: true,
        autoWatchOnComment: true,
        autoWatchOnCreate: true,
        autoWatchOnVote: false,
        autoWatchOnUpdate: false
      };
      
      mockAxios.onGet(`${baseUrl}/users/${userId}/profiles/notifications`).reply(200, mockSettings);
      
      const settings = await youtrackClient.getUserNotificationSettings(userId);
      
      expect(settings).toEqual(mockSettings);
      expect(mockAxios.history.get.length).toBe(1);
      expect(mockAxios.history.get[0].url).toContain(`/users/${userId}/profiles/notifications`);
    });
    
    it('should update user notification settings', async () => {
      const userId = 'user-1';
      // Create a properly typed partial NotificationsUserProfile
      const updateSettings: Partial<NotificationsUserProfile> = {
        emailNotificationsEnabled: false
      };
      const mockResponse = {
        id: userId,
        emailNotificationsEnabled: false,
        jabberNotificationsEnabled: false,
        notifyOnOwnChanges: false,
        mentionNotificationsEnabled: true,
        autoWatchOnComment: true,
        autoWatchOnCreate: true,
        autoWatchOnVote: false,
        autoWatchOnUpdate: false
      };
      
      mockAxios.onPost(`${baseUrl}/users/${userId}/profiles/notifications`).reply(200, mockResponse);
      
      const settings = await youtrackClient.updateUserNotificationSettings(userId, updateSettings);
      
      expect(settings).toEqual(mockResponse);
      expect(mockAxios.history.post.length).toBe(1);
      expect(mockAxios.history.post[0].url).toContain(`/users/${userId}/profiles/notifications`);
      expect(JSON.parse(mockAxios.history.post[0].data)).toEqual(updateSettings);
    });
  });
});