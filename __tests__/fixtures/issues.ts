import { Issue, IssueWithActivities } from '../../src/types/youtrack';
import fs from 'fs';
import path from 'path';

// Path to the real data
const realIssuesPath = path.join(__dirname, '..', '..', 'output', 'tests', 'real-sprint-issues.json');
const TOTAL_ISSUES = 10; // Updated to handle 10 issue files

/**
 * Generates sample issues for testing
 * @param count Number of sample issues to generate
 * @returns Array of sample issues
 */
const generateSampleIssues = (count: number): Issue[] => {
  const samples: Issue[] = [];
  
  // Sample prefixes to create more variety
  const prefixes = ['SAMPLE', 'TEST', 'DEMO', 'MOCK'];
  
  for (let i = 0; i < count; i++) {
    const prefix = prefixes[i % prefixes.length];
    const num = 1000 + i;
    
    samples.push({
      id: `sample-${i + 1}`,
      idReadable: `${prefix}-${num}`,
      numberInProject: num,
      summary: `Sample issue ${i + 1} for testing purposes`,
      description: `This is sample issue #${i + 1} for testing`,
      created: Date.now() - (i + 1) * 86400000, // Each issue created a day apart
      updated: Date.now() - (i + 1) * 43200000, // Each issue updated 12 hours apart
      resolved: i % 3 === 0 ? Date.now() - (i + 1) * 21600000 : null, // Every third issue is resolved
      customFields: [],
      $type: 'Issue'
    });
  }
  
  return samples;
};

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
  
  // Load detailed issues with activities using a loop
  for (let i = 1; i <= TOTAL_ISSUES; i++) {
    const issueFilePath = path.join(__dirname, '..', '..', 'output', 'tests', `real-issue-${i}-with-activities.json`);
    try {
      const issueData = fs.readFileSync(issueFilePath, 'utf8');
      const issue = JSON.parse(issueData);
      detailedIssues.push(issue);
    } catch (error) {
      console.warn(`Could not load issue ${i} data`);
    }
  }
} catch (error) {
  console.warn('Could not load real issues data, using sample data instead');
  
  // Generate sample issues using TOTAL_ISSUES constant
  issues = generateSampleIssues(TOTAL_ISSUES);
  
  // If no real data, sprint issues are just the first two sample issues
  sprintIssues = issues.slice(0, Math.min(2, TOTAL_ISSUES));
  
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