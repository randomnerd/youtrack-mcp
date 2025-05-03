import { ActivityItem } from '../../src/types/youtrack';
import fs from 'fs';
import path from 'path';
import issueFixtures from './issues';

// Path to detailed issues with activities
const realIssue1Path = path.join(__dirname, '..', '..', 'output', 'tests', 'real-issue-1-with-activities.json');
const realIssue2Path = path.join(__dirname, '..', '..', 'output', 'tests', 'real-issue-2-with-activities.json');
const realIssue3Path = path.join(__dirname, '..', '..', 'output', 'tests', 'real-issue-3-with-activities.json');

// Load real data if available, otherwise use sample data
let activities: ActivityItem[] = [];
let activitiesByIssue: Record<string, ActivityItem[]> = {};

try {
  // Load activities from detailed issues
  const loadActivitiesFromIssue = (issuePath: string): ActivityItem[] => {
    try {
      const issueData = fs.readFileSync(issuePath, 'utf8');
      const issue = JSON.parse(issueData);
      return issue.activities || [];
    } catch (error) {
      return [];
    }
  };

  const issue1Activities = loadActivitiesFromIssue(realIssue1Path);
  const issue2Activities = loadActivitiesFromIssue(realIssue2Path);
  const issue3Activities = loadActivitiesFromIssue(realIssue3Path);
  
  // Combine all activities
  activities = [...issue1Activities, ...issue2Activities, ...issue3Activities];
  
  // If we have any activities and detailed issues
  if (activities.length > 0 && issueFixtures.detailedIssues.length > 0) {
    // Create mapping of activities by issue ID
    issueFixtures.detailedIssues.forEach((issue, index) => {
      const issueActivities = index === 0 ? issue1Activities : 
                              index === 1 ? issue2Activities : 
                              index === 2 ? issue3Activities : [];
      
      if (issue.id) {
        activitiesByIssue[issue.id] = issueActivities;
      }
      if (issue.idReadable) {
        activitiesByIssue[issue.idReadable] = issueActivities;
      }
    });
  }
} catch (error) {
  console.warn('Could not load real activities data, using sample data instead');
  // Sample activities matching YouTrack API structure
  activities = [
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
  
  // Sample mapping for activities by issue
  activitiesByIssue = {
    'SAMPLE-1659': activities.slice(0, 3),
    'SAMPLE-1983': activities.slice(1, 3),
    'TEST-1': activities.slice(0, 2),
    'TEST-2': activities.slice(1, 3)
  };
}

// Activity pages for pagination testing (using the first few activities)
export const activityPage = {
  $type: 'CursorPage',
  activities: activities.slice(0, Math.min(2, activities.length)),
  hasNext: true,
  hasPrev: false,
  nextCursor: 'next-cursor-123'
};

export default {
  activities,
  activityPage,
  activitiesByIssue
}; 