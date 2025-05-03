import { Issue } from '../../src/types/youtrack';

export const issues: Issue[] = [
  {
    id: '1',
    idReadable: 'TEST-1',
    summary: 'Test issue 1',
    description: 'This is a test issue for unit tests',
    created: Date.now() - 86400000, // 1 day ago
    updated: Date.now() - 43200000, // 12 hours ago
    resolved: null,
    customFields: []
  },
  {
    id: '2',
    idReadable: 'TEST-2',
    summary: 'Test issue 2',
    description: 'Another test issue',
    created: Date.now() - 172800000, // 2 days ago
    updated: Date.now() - 86400000, // 1 day ago
    resolved: true, // Issue is resolved
    customFields: []
  }
];

export const listIssues = issues;

export default {
  issues,
  listIssues
}; 