import { 
  formatYouTrackData, 
  formatActivities,
  formatComment,
  formatComments,
  SimpleActivity
} from '../../../src/utils/youtrack-json-formatter';
import * as issueFormatter from '../../../src/utils/issue-formatter';

// Mock the dependency
jest.mock('../../../src/utils/issue-formatter', () => ({
  formatDate: jest.fn().mockImplementation((date) => 
    date ? new Date(date).toISOString().split('T')[0] : 'unknown date'
  ),
  formatFileSize: jest.fn().mockImplementation((size) => 
    size ? `${Math.floor(size / 1024)} KB` : 'N/A'
  )
}));

describe('YouTrack JSON Formatter Additional Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test data for activities
  const mockUser = {
    id: 'user-1',
    login: 'testuser',
    name: 'Test User'
  };

  const mockIssueCommentActivity = {
    $type: 'IssueCommentActivityItem',
    author: mockUser,
    timestamp: '2021-05-03T10:00:00.000Z',
    added: [
      {
        $type: 'IssueComment',
        text: 'This is a comment text'
      }
    ]
  };

  const mockIssueStateChangedActivity = {
    id: 'activity-2',
    $type: 'IssueStateChangedActivityItem',
    timestamp: 1620000000000,
    author: mockUser,
    target: { id: 'issue-1' },
    added: { fields: [{ name: 'State', value: 'Fixed' }] },
    removed: { fields: [{ name: 'State', value: 'Open' }] }
  };

  const mockAuthorlessActivity = {
    id: 'activity-3',
    $type: 'VcsChangeActivityItem',
    timestamp: 1620000000000,
    target: { id: 'issue-1' },
    added: { changes: [{ id: 'change-1', version: '123' }] }
  };

  const mockTimestamplessActivity = {
    id: 'activity-4',
    $type: 'VcsChangeActivityItem',
    author: mockUser,
    target: { id: 'issue-1' },
    added: { changes: [{ id: 'change-1', version: '123' }] }
  };

  describe('formatActivities with edge cases', () => {
    it('should handle activities with null fields', () => {
      const activity = {
        $type: 'ActivityItem',
        author: null,
        timestamp: null
      };
      
      const result = formatActivities([activity]);
      expect(result).toHaveLength(1);
      expect(result[0].author).toBeUndefined();
      expect(result[0].timestamp).toBe('unknown date');
    });

    it('should handle empty activities array', () => {
      const result = formatActivities([]);
      expect(result).toEqual([]);
    });

    it('should handle undefined activities', () => {
      const result = formatActivities(undefined);
      expect(result).toEqual([]);
    });

    it('should handle non-array activities', () => {
      // @ts-ignore
      const result = formatActivities({});
      expect(result).toEqual([]);
    });

    it('should handle activity with author correctly', () => {
      const result = formatActivities([{
        $type: 'ActivityItem',
        author: mockUser,
        timestamp: '2021-05-03T10:00:00.000Z'
      }]);
      
      expect(result).toHaveLength(1);
      expect(result[0].author).toBe('user-1');
      expect(result[0].timestamp).toBe('2021-05-03');
    });

    it('should handle activities without author', () => {
      const result = formatActivities([{
        $type: 'ActivityItem',
        timestamp: '2021-05-03T10:00:00.000Z'
      }]);
      
      expect(result).toHaveLength(1);
      expect(result[0].author).toBeUndefined();
    });

    it('should apply maxActivities option', () => {
      const activities = [
        { $type: 'ActivityItem', author: mockUser, timestamp: '2021-05-01T10:00:00.000Z' },
        { $type: 'ActivityItem', author: mockUser, timestamp: '2021-05-02T10:00:00.000Z' },
        { $type: 'ActivityItem', author: mockUser, timestamp: '2021-05-03T10:00:00.000Z' }
      ];
      
      const result = formatActivities(activities, { maxActivities: 2 });
      expect(result).toHaveLength(2);
    });

    it('should not apply limit if maxActivities is 0', () => {
      const activities = [
        { $type: 'ActivityItem', author: mockUser, timestamp: '2021-05-01T10:00:00.000Z' },
        { $type: 'ActivityItem', author: mockUser, timestamp: '2021-05-02T10:00:00.000Z' },
        { $type: 'ActivityItem', author: mockUser, timestamp: '2021-05-03T10:00:00.000Z' }
      ];
      
      const result = formatActivities(activities, { maxActivities: 0 });
      expect(result).toHaveLength(3);
    });
  });

  describe('formatComment function', () => {
    it('should handle normal comment', () => {
      const comment = {
        id: 'comment-1',
        text: 'This is a comment',
        author: mockUser,
        created: '2021-05-03T10:00:00.000Z'
      };
      
      const result = formatComment(comment);
      expect(result).toEqual({
        id: 'comment-1',
        text: 'This is a comment',
        author: 'user-1',
        created: '2021-05-03'
      });
    });

    it('should handle undefined comment', () => {
      const result = formatComment(undefined);
      expect(result).toBeNull();
    });

    it('should truncate long comment text', () => {
      const longText = 'a'.repeat(200);
      const longComment = {
        id: 'comment-1',
        text: longText,
        author: mockUser,
        created: '2021-05-03T10:00:00.000Z'
      };
      
      const result = formatComment(longComment, { maxCommentLength: 100 });
      expect(result?.text.length).toBeLessThanOrEqual(113); // 100 chars plus " [truncated]"
      expect(result?.text.endsWith(' [truncated]')).toBe(true);
    });

    it('should handle missing text', () => {
      const noTextComment = {
        id: 'comment-1',
        author: mockUser,
        created: '2021-05-03T10:00:00.000Z'
      };
      
      const result = formatComment(noTextComment);
      expect(result?.text).toBe('');
    });

    it('should handle missing author', () => {
      const noAuthorComment = {
        id: 'comment-1',
        text: 'No author comment',
        created: '2021-05-03T10:00:00.000Z'
      };
      
      const result = formatComment(noAuthorComment);
      expect(result?.author).toBeUndefined();
    });

    it('should handle null created date', () => {
      const noDateComment = {
        id: 'comment-1',
        text: 'No date comment',
        author: mockUser,
        created: null
      };
      
      const result = formatComment(noDateComment);
      expect(result?.created).toBe('unknown date');
    });
  });

  describe('formatYouTrackData with various data types', () => {
    it('should handle null or undefined input', () => {
      expect(formatYouTrackData(null)).toBeNull();
      expect(formatYouTrackData(undefined)).toBeNull();
    });

    it('should handle arrays', () => {
      const data = [
        { id: 'item1', name: 'Item 1' },
        { id: 'item2', name: 'Item 2' }
      ];
      
      const result = formatYouTrackData(data);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });
  });
}); 