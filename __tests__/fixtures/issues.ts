import { Issue } from '../../src/types/youtrack';

// Combine existing test data with sample data that matches YouTrack API structure
export const issues: Issue[] = [
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

// Issues for sprint mockup
export const sprintIssues = [
  issues[0],
  issues[1]
];

export const listIssues = issues;

export default {
  issues,
  sprintIssues,
  listIssues
}; 