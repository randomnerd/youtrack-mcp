import * as YouTrackTypes from '../../../src/types/youtrack';
import { extractCommentsFromActivities } from '../../../src/utils/issue-formatter';

describe('extractCommentsFromActivities', () => {
  it('should extract comments from activities with target.text property', () => {
    const activities: YouTrackTypes.ActivityItem[] = [
      {
        id: 'activity1',
        $type: 'CommentActivityItem',
        timestamp: 1620000000000,
        author: {
          id: 'user1',
          name: 'User One',
          fullName: 'User One',
          $type: 'User'
        },
        target: {
          id: 'comment1',
          text: 'This is a target text comment',
          $type: 'IssueComment'
        }
      },
      {
        id: 'activity2', 
        $type: 'CustomFieldActivityItem',
        timestamp: 1620000000000,
        author: {
          id: 'user1',
          name: 'User One',
          $type: 'User'
        },
        field: {
          id: 'field1',
          name: 'Status',
          $type: 'CustomFilterField'
        }
      }
    ];

    const comments = extractCommentsFromActivities(activities);
    
    expect(comments.length).toBe(1);
    expect(comments[0].id).toBe('comment1');
    expect(comments[0].text).toBe('This is a target text comment');
    expect(comments[0].author.fullName).toBe('User One');
    expect(comments[0].created).toBe(1620000000000);
  });

  it('should extract comments from activities with added field as object', () => {
    const activities: YouTrackTypes.ActivityItem[] = [
      {
        id: 'activity1',
        $type: 'CommentActivityItem',
        timestamp: 1620000000000,
        author: {
          id: 'user1',
          name: 'User One',
          fullName: 'User One',
          $type: 'User'
        },
        added: {
          id: 'comment1',
          text: 'This is a comment in added field as object',
          created: 1620000000000,
          author: {
            id: 'user1',
            name: 'User One',
            fullName: 'User One',
            $type: 'User'
          },
          $type: 'IssueComment'
        }
      }
    ];

    const comments = extractCommentsFromActivities(activities);
    
    expect(comments.length).toBe(1);
    expect(comments[0].id).toBe('comment1');
    expect(comments[0].text).toBe('This is a comment in added field as object');
  });

  it('should extract comments from activities with added field as array', () => {
    const activities: YouTrackTypes.ActivityItem[] = [
      {
        id: 'activity1',
        $type: 'CommentActivityItem',
        timestamp: 1620000000000,
        author: {
          id: 'user1',
          name: 'User One',
          fullName: 'User One',
          $type: 'User'
        },
        added: [
          {
            id: 'comment1',
            text: 'This is a comment in added field as array item 1',
            created: 1620000000000,
            $type: 'IssueComment'
          },
          {
            id: 'comment2',
            text: 'This is a comment in added field as array item 2',
            created: 1620000001000,
            $type: 'IssueComment'
          }
        ]
      }
    ];

    const comments = extractCommentsFromActivities(activities);
    
    expect(comments.length).toBe(2);
    expect(comments[0].id).toBe('comment1');
    expect(comments[0].text).toBe('This is a comment in added field as array item 1');
    expect(comments[1].id).toBe('comment2');
    expect(comments[1].text).toBe('This is a comment in added field as array item 2');
  });

  it('should handle comments with missing text property', () => {
    const activities: YouTrackTypes.ActivityItem[] = [
      {
        id: 'activity1',
        $type: 'CommentActivityItem',
        timestamp: 1620000000000,
        author: {
          id: 'user1',
          name: 'User One',
          fullName: 'User One',
          $type: 'User'
        },
        target: {
          id: 'comment1',
          $type: 'IssueComment'
        }
      }
    ];

    const comments = extractCommentsFromActivities(activities);
    
    expect(comments.length).toBe(1);
    expect(comments[0].id).toBe('comment1');
    expect(comments[0].text).toBeNull();
  });

  it('should sort comments by created date', () => {
    const activities: YouTrackTypes.ActivityItem[] = [
      {
        id: 'activity2',
        $type: 'CommentActivityItem',
        timestamp: 1620000002000,
        author: {
          id: 'user2',
          name: 'User Two',
          $type: 'User'
        },
        target: {
          id: 'comment2',
          text: 'Second comment',
          $type: 'IssueComment'
        }
      },
      {
        id: 'activity1',
        $type: 'CommentActivityItem',
        timestamp: 1620000001000,
        author: {
          id: 'user1',
          name: 'User One',
          $type: 'User'
        },
        target: {
          id: 'comment1',
          text: 'First comment',
          $type: 'IssueComment'
        }
      }
    ];

    const comments = extractCommentsFromActivities(activities);
    
    expect(comments.length).toBe(2);
    expect(comments[0].text).toBe('First comment');
    expect(comments[1].text).toBe('Second comment');
  });

  it('should handle empty activities array', () => {
    expect(extractCommentsFromActivities([])).toEqual([]);
  });

  it('should handle undefined activities', () => {
    expect(extractCommentsFromActivities(undefined as any)).toEqual([]);
  });
}); 