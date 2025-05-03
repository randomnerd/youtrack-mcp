import { Issue, IssueWithActivities } from '../../src/types/youtrack';
import fs from 'fs';
import path from 'path';

// Path to the real data
const realIssuesPath = path.join(__dirname, '..', '..', 'output', 'tests', 'real-sprint-issues.json');
const realIssue1Path = path.join(__dirname, '..', '..', 'output', 'tests', 'real-issue-1-with-activities.json');
const realIssue2Path = path.join(__dirname, '..', '..', 'output', 'tests', 'real-issue-2-with-activities.json');
const realIssue3Path = path.join(__dirname, '..', '..', 'output', 'tests', 'real-issue-3-with-activities.json');

// Load real data if available, otherwise use sample data
let issues: Issue[] = [];
let detailedIssues: IssueWithActivities[] = [];
let sprintIssues: Issue[] = [];

try {
  // Load all sprint issues
  const sprintIssuesData = fs.readFileSync(realIssuesPath, 'utf8');
  sprintIssues = JSON.parse(sprintIssuesData);
  
  // Base issues are the same as sprint issues
  issues = [...sprintIssues];
  
  // Load detailed issues with activities
  try {
    const issue1Data = fs.readFileSync(realIssue1Path, 'utf8');
    const issue1 = JSON.parse(issue1Data);
    detailedIssues.push(issue1);
    
    try {
      const issue2Data = fs.readFileSync(realIssue2Path, 'utf8');
      const issue2 = JSON.parse(issue2Data);
      detailedIssues.push(issue2);
      
      try {
        const issue3Data = fs.readFileSync(realIssue3Path, 'utf8');
        const issue3 = JSON.parse(issue3Data);
        detailedIssues.push(issue3);
      } catch (error) {
        console.warn('Could not load issue 3 data');
      }
    } catch (error) {
      console.warn('Could not load issue 2 data');
    }
  } catch (error) {
    console.warn('Could not load detailed issues data');
  }
} catch (error) {
  console.warn('Could not load real issues data, using sample data instead');
  // Sample issue data that matches YouTrack API structure
  issues = [
    {
      id: 'sample-1',
      idReadable: 'SAMPLE-1659',
      numberInProject: 1659,
      summary: "Sample issue for testing tracking features",
      description: "This is a sample description for testing purposes",
      created: 1743825363340, // Sample created date
      updated: 1745825363340,
      resolved: null,
      customFields: [],
      $type: 'Issue'
    },
    {
      id: 'sample-2',
      idReadable: 'SAMPLE-1983',
      numberInProject: 1983,
      summary: "Sample payment provider integration",
      description: "This is a placeholder for payment provider integration task",
      created: 1743925363340, // Sample created date
      updated: 1745925363340,
      resolved: null,
      customFields: [],
      $type: 'Issue'
    },
    {
      id: '1',
      idReadable: 'TEST-1',
      numberInProject: 1,
      summary: 'Test issue 1',
      description: 'This is a test issue for unit tests',
      created: Date.now() - 86400000, // 1 day ago
      updated: Date.now() - 43200000, // 12 hours ago
      resolved: null,
      customFields: [],
      $type: 'Issue'
    },
    {
      id: '2',
      idReadable: 'TEST-2',
      numberInProject: 2,
      summary: 'Test issue 2',
      description: 'Another test issue',
      created: Date.now() - 172800000, // 2 days ago
      updated: Date.now() - 86400000, // 1 day ago
      resolved: true, // Issue is resolved
      customFields: [],
      $type: 'Issue'
    }
  ];
  
  // If no real data, sprint issues are just the first two sample issues
  sprintIssues = [
    issues[0],
    issues[1]
  ];
  
  // Sample detailed issues with activities
  detailedIssues = issues.map(issue => ({
    ...issue,
    activities: []
  }));
}

// Export for backward compatibility
export { issues };
export { sprintIssues };
export const listIssues = issues;

// For single issue retrievals by ID
export const issuesById: Record<string, IssueWithActivities> = {};
detailedIssues.forEach(issue => {
  if (issue.id) {
    issuesById[issue.id] = issue;
  }
  if (issue.idReadable) {
    issuesById[issue.idReadable] = issue;
  }
});

export default {
  issues,
  sprintIssues,
  listIssues,
  detailedIssues,
  issuesById
}; 