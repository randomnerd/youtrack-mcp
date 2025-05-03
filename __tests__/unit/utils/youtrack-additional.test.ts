import { YouTrack } from '../../../src/utils/youtrack';
import mockAxios, { setupYouTrackApiMocks, resetMocks } from '../../mocks/youtrack-api.mock';
import { NotificationsUserProfile } from '../../../src/types/youtrack';

// Access private methods via direct module import
const youtrackModule = require('../../../src/utils/youtrack');

describe('YouTrack API Client - Additional Coverage Tests', () => {
  const baseUrl = 'http://youtrack-test.example.com/api';
  const token = 'test-token';
  let youtrackClient: YouTrack;

  beforeEach(() => {
    resetMocks();
    setupYouTrackApiMocks(baseUrl);
    youtrackClient = new YouTrack(baseUrl, token);
    mockAxios.resetHistory();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Private utility methods', () => {
    describe('isRetryableError', () => {
      it('should identify 5XX errors as retryable', () => {
        const client = youtrackClient as any;
        expect(client.isRetryableError({ response: { status: 500 } })).toBe(true);
        expect(client.isRetryableError({ response: { status: 502 } })).toBe(true);
        expect(client.isRetryableError({ response: { status: 503 } })).toBe(true);
        expect(client.isRetryableError({ response: { status: 504 } })).toBe(true);
      });

      it('should identify rate limit errors as retryable', () => {
        const client = youtrackClient as any;
        expect(client.isRetryableError({ response: { status: 429 } })).toBe(true);
      });

      it('should identify network errors as retryable', () => {
        const client = youtrackClient as any;
        expect(client.isRetryableError({ message: 'Network Error' })).toBe(true);
        expect(client.isRetryableError({ message: 'timeout of 1000ms exceeded' })).toBe(true);
      });

      it('should identify client errors as non-retryable', () => {
        const client = youtrackClient as any;
        expect(client.isRetryableError({ response: { status: 400 } })).toBe(false);
        expect(client.isRetryableError({ response: { status: 401 } })).toBe(false);
        expect(client.isRetryableError({ response: { status: 403 } })).toBe(false);
        expect(client.isRetryableError({ response: { status: 404 } })).toBe(false);
      });
    });

    describe('calculateRetryDelay', () => {
      it('should use exponential backoff algorithm', () => {
        const client = youtrackClient as any;
        const delay1 = client.calculateRetryDelay(1);
        const delay2 = client.calculateRetryDelay(2);
        const delay3 = client.calculateRetryDelay(3);

        expect(delay2).toBeGreaterThan(delay1);
        expect(delay3).toBeGreaterThan(delay2);
      });

      it('should have reasonable bounds', () => {
        const client = youtrackClient as any;
        const delay1 = client.calculateRetryDelay(1);
        const delay5 = client.calculateRetryDelay(5);

        expect(delay1).toBeGreaterThanOrEqual(100); // min delay
        expect(delay5).toBeLessThanOrEqual(30000); // max delay (30s)
      });
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

  describe('Activity-related methods', () => {
    const issueId = 'TEST-123';
    
    beforeEach(() => {
      // Set up mock data for activities
      const activities = [
        {
          id: 'activity-1',
          $type: 'IssueCreatedActivityItem',
          timestamp: 1620000000000,
          author: {
            id: 'user-1',
            $type: 'User',
            name: 'Sample User One',
            fullName: 'Sample User One',
            login: 'user1'
          }
        },
        {
          id: 'activity-2',
          $type: 'CustomFieldActivityItem',
          timestamp: 1620100000000,
          author: {
            id: 'user-2',
            $type: 'User',
            name: 'Sample User Two',
            fullName: 'Sample User Two',
            login: 'user2'
          },
          field: {
            id: 'field-1',
            name: 'State',
            $type: 'CustomField'
          },
          added: [{ id: 'state-1', name: 'In Progress', $type: 'StateBundleElement' }],
          removed: [{ id: 'state-0', name: 'Open', $type: 'StateBundleElement' }]
        }
      ];
      
      mockAxios.onGet(`${baseUrl}/issues/${issueId}/activities`).reply(200, activities);
      
      const activityPage = {
        $type: 'CursorPage',
        activities: activities.slice(0, 1),
        hasNext: true, 
        hasPrev: false,
        nextCursor: 'next-cursor-123'
      };
      
      mockAxios.onGet(`${baseUrl}/issues/${issueId}/activitiesPage`).reply(200, activityPage);
    });

    it('should handle adding activities to issues', async () => {
      const issue = {
        id: issueId,
        idReadable: issueId,
        summary: 'Test Issue'
      };
      
      const result = await (youtrackClient as any).addActivitiesToIssues(issue);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(issueId);
      expect(result[0].activities).toBeDefined();
      expect(Array.isArray(result[0].activities)).toBe(true);
      expect(mockAxios.history.get.length).toBe(1);
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
}); 