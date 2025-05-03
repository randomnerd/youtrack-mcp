import { ActivityItem } from '../../src/types/youtrack';

// Sample activities matching YouTrack API structure
export const activities: ActivityItem[] = [
  {
    id: 'activity-1',
    $type: 'IssueCreatedActivityItem',
    timestamp: 1620000000000,
    author: { 
      id: 'user-1', 
      login: 'user1',
      fullName: 'Sample User One',
      name: 'Sample User One',
      $type: 'User'
    }
  },
  {
    id: 'activity-2',
    $type: 'CustomFieldActivityItem',
    timestamp: 1620100000000,
    author: { 
      id: 'user-2', 
      login: 'user2',
      fullName: 'Sample User Two',
      name: 'Sample User Two',
      $type: 'User'
    },
    field: {
      id: 'field-1',
      name: 'State',
      $type: 'CustomField' 
    },
    added: [
      {
        id: 'state-1',
        name: 'In Progress',
        $type: 'StateBundleElement'
      }
    ],
    removed: [
      {
        id: 'state-0',
        name: 'Open',
        $type: 'StateBundleElement'
      }
    ]
  },
  {
    id: 'activity-3',
    $type: 'CommentActivityItem',
    timestamp: 1620200000000,
    author: { 
      id: 'user-1', 
      login: 'user1',
      fullName: 'Sample User One',
      name: 'Sample User One',
      $type: 'User'
    },
    added: [
      {
        id: 'comment-1',
        text: 'This is a sample comment on the issue',
        $type: 'Comment'
      }
    ],
    removed: []
  }
];

// Activity pages for pagination testing
export const activityPage = {
  $type: 'CursorPage',
  activities: activities.slice(0, 2),
  hasNext: true,
  hasPrev: false,
  nextCursor: 'next-cursor-123'
};

export const activitiesByIssue: Record<string, ActivityItem[]> = {
  'SAMPLE-1659': activities.slice(0, 3),
  'SAMPLE-1983': activities.slice(1, 3),
  'TEST-1': activities.slice(0, 2),
  'TEST-2': activities.slice(1, 3)
};

export default {
  activities,
  activityPage,
  activitiesByIssue
}; 