import fs from 'fs';
import path from 'path';
import { formatIssueForAI, formatIssuesForAI, IssueFormatterOptions } from '../../../src/utils/issue-formatter';
import * as YouTrackTypes from '../../../src/types/youtrack';
import dataAnonymizer from '../../helpers/data-anonymizer';
import { issues, sprintIssues } from '../../fixtures/issues';

// Define test output directory
const TEST_OUTPUT_DIR = path.join(__dirname, '..', '..', '..', 'output', 'tests');

describe('Issue Formatter Tests', () => {
  beforeAll(() => {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
    }
  });
  
  // Helper function to save formatted text to file
  function saveFormattedText(text: string, filename: string): void {
    const filePath = path.join(TEST_OUTPUT_DIR, filename);
    fs.writeFileSync(filePath, text, 'utf8');
    console.log(`Formatted text saved to ${filePath}`);
  }
  
  // Helper function to ensure we have a sample issue with activities for testing
  function createSampleIssueWithActivities(): YouTrackTypes.IssueWithActivities {
    // Start with a sample issue from fixtures
    const baseIssue = issues[0];
    
    // Create sample activities
    const activities: YouTrackTypes.ActivityItem[] = [
      {
        id: 'activity1',
        $type: 'CustomFieldActivityItem',
        timestamp: Date.now() - 86400000, // 1 day ago
        author: {
          id: 'user1',
          name: 'Test User',
          fullName: 'Test User',
          $type: 'User'
        },
        target: {
          id: baseIssue.id,
          $type: 'Issue'
        },
        field: {
          id: 'field1',
          name: 'Status',
          $type: 'CustomFilterField'
        },
        added: [
          {
            id: 'added1',
            name: 'In Progress',
            $type: 'ActivityChange'
          }
        ],
        removed: [
          {
            id: 'removed1',
            name: 'Open',
            $type: 'ActivityChange'
          }
        ]
      },
      {
        id: 'activity2',
        $type: 'CommentActivityItem',
        timestamp: Date.now() - 43200000, // 12 hours ago
        author: {
          id: 'user2',
          name: 'Another User',
          fullName: 'Another User',
          $type: 'User'
        },
        target: {
          id: 'comment1',
          text: 'This is a sample comment for testing',
          $type: 'IssueComment'
        }
      }
    ];
    
    // Create an issue with activities
    const issueWithActivities: YouTrackTypes.IssueWithActivities = {
      ...baseIssue,
      activities
    };
    
    return issueWithActivities;
  }
  
  test('Format single issue with activities', () => {
    // Create sample issue with activities
    const sampleIssueWithActivities = createSampleIssueWithActivities();
    
    // Test options
    const options: IssueFormatterOptions = {
      maxTextLength: 200,
      includeRawData: false,
      includeActivities: true,
      maxActivities: 5,
      includeAttachments: true
    };
    
    // Format the issue
    const formattedIssueWithActivities = formatIssueForAI(sampleIssueWithActivities, options);
    
    // Save the formatted output
    saveFormattedText(formattedIssueWithActivities, 'formatted-issue-with-activities.txt');
    
    // Assertions
    expect(formattedIssueWithActivities).toContain(sampleIssueWithActivities.idReadable);
    expect(formattedIssueWithActivities).toContain(sampleIssueWithActivities.summary);
    expect(formattedIssueWithActivities).toContain('ACTIVITY HISTORY');
    expect(formattedIssueWithActivities).toContain('Status');
    expect(formattedIssueWithActivities).toContain('In Progress');
  });
  
  test('Format single issue without activities', () => {
    // Use a sample issue from fixtures
    const sampleIssue = issues[0];
    
    // Format the issue without activities
    const formattedDetailedIssue = formatIssueForAI(sampleIssue, {
      includeActivities: false,
      maxTextLength: 200
    });
    
    // Save the formatted output
    saveFormattedText(formattedDetailedIssue, 'formatted-detailed-issue.txt');
    
    // Assertions
    expect(formattedDetailedIssue).toContain(sampleIssue.idReadable);
    expect(formattedDetailedIssue).toContain(sampleIssue.summary);
    expect(formattedDetailedIssue).not.toContain('ACTIVITY HISTORY');
  });
  
  test('Format multiple issues', () => {
    // Use sample sprint issues from fixtures
    const sampleSprintIssues = sprintIssues.slice(0, 3);
    
    // Format multiple issues
    const formattedMultipleIssues = formatIssuesForAI(sampleSprintIssues, {
      maxTextLength: 100,
      includeRawData: false
    });
    
    // Save the formatted output
    saveFormattedText(formattedMultipleIssues, 'formatted-multiple-issues.txt');
    
    // Assertions
    expect(formattedMultipleIssues).toContain('ISSUES SUMMARY');
    expect(formattedMultipleIssues).toContain(sampleSprintIssues[0].idReadable);
    expect(formattedMultipleIssues).toContain(sampleSprintIssues[1].idReadable);
  });
  
  test('Format multiple issues with activities', () => {
    // Create sample issue with activities
    const sampleIssueWithActivities = createSampleIssueWithActivities();
    
    // Combine with other sample issues
    const enhancedIssues = [
      sampleIssueWithActivities,
      ...sprintIssues.slice(0, 2)
    ];
    
    // Format multiple issues with activities
    const formattedMultipleIssuesWithActivities = formatIssuesForAI(enhancedIssues, {
      maxTextLength: 100,
      includeRawData: false,
      includeActivities: true
    });
    
    // Save the formatted output
    saveFormattedText(formattedMultipleIssuesWithActivities, 'formatted-multiple-issues-with-activities.txt');
    
    // Assertions
    expect(formattedMultipleIssuesWithActivities).toContain('ISSUES SUMMARY');
    expect(formattedMultipleIssuesWithActivities).toContain('CONTRIBUTORS');
    expect(formattedMultipleIssuesWithActivities).toContain(sampleIssueWithActivities.idReadable);
  });
  
  test('Test anonymization with issue formatter', () => {
    // Create sample issue with activities
    const sampleIssueWithActivities = createSampleIssueWithActivities();
    
    // Anonymize the issue
    const anonymizedIssue = dataAnonymizer.anonymizeIssueWithActivities(sampleIssueWithActivities);
    
    // Format the anonymized issue
    const formattedAnonymizedIssue = formatIssueForAI(anonymizedIssue, {
      includeActivities: true,
      maxTextLength: 200
    });
    
    // Save the formatted output
    saveFormattedText(formattedAnonymizedIssue, 'formatted-anonymized-issue.txt');
    
    // Assertions
    expect(formattedAnonymizedIssue).toContain('PROJ');
    expect(formattedAnonymizedIssue).toContain('Sample issue:');
    // Make sure original identifying info is not present
    if (sampleIssueWithActivities.summary) {
      // Only check if it contains sensitive info
      if (!sampleIssueWithActivities.summary.startsWith('Sample issue:')) {
        expect(formattedAnonymizedIssue).not.toContain(sampleIssueWithActivities.summary);
      }
    }
    
    // Verify that the anonymized issue still works with the formatter
    expect(formattedAnonymizedIssue).toContain('BASIC INFO');
    expect(formattedAnonymizedIssue).toContain('ACTIVITY HISTORY');
  });
}); 