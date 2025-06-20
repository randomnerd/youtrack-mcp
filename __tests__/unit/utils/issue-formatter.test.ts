import fs from 'fs';
import path from 'path';
import { formatIssueForAI, formatIssuesForAI, IssueFormatterOptions } from '../../../src/utils/issue-formatter';
import * as YouTrackTypes from '../../../src/types/youtrack';
import dataAnonymizer from '../../helpers/data-anonymizer';
import { issues, sprintIssues } from '../../fixtures/issues';

// Access private functions for testing
// We use this approach to test private functions without modifying the original file
import * as issueFormatterModule from '../../../src/utils/issue-formatter';
const { 
  stripMarkdown, 
  extractContributors, 
  formatActivities, 
  extractSprintInformation, 
  formatFileSize,
  formatDate,
  formatLinks,
  formatComments,
  formatAttachments,
  formatBasicInfo,
  formatCustomFields,
  formatIssuesOverview,
  formatPeriodValue,
  getLinkRelationName,
  extractCommentsFromActivities
} = issueFormatterModule as any;

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

// Adding private function tests from issue-formatter-additional.test.ts
describe('Issue Formatter - Private Function Tests', () => {
  describe('stripMarkdown function', () => {
    it('should strip basic markdown formatting', () => {
      const markdown = '# Heading\n\n**Bold text**\n*Italic text*\n';
      const result = stripMarkdown(markdown);
      expect(result).toContain('Heading');
      expect(result).toContain('Bold text');
      expect(result).toContain('Italic text');
      expect(result).not.toContain('#');
      expect(result).not.toContain('**');
      expect(result).not.toContain('*');
    });

    it('should handle code blocks and links', () => {
      const markdown = '```typescript\nconst x = 1;\n```\n[Link text](https://example.com)';
      const result = stripMarkdown(markdown);
      expect(result).toContain('const x = 1;');
      expect(result).toContain('Link text');
      expect(result).not.toContain('```');
      expect(result).not.toContain('[Link text]');
      expect(result).not.toContain('(https://example.com)');
    });

    it('should handle empty or non-markdown text', () => {
      expect(stripMarkdown('')).toBe('');
      expect(stripMarkdown('Plain text without markdown')).toBe('Plain text without markdown');
    });

    it('should handle markdown tables', () => {
      const markdown = '| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |';
      const result = stripMarkdown(markdown);
      expect(result).toContain('Header 1');
      expect(result).toContain('Header 2');
      expect(result).toContain('Cell 1');
      expect(result).toContain('Cell 2');
      expect(result).not.toContain('|');
      expect(result).not.toContain('---');
    });

    it('should handle markdown lists', () => {
      const markdown = '- Item 1\n- Item 2\n1. Numbered 1\n2. Numbered 2';
      const result = stripMarkdown(markdown);
      expect(result).toContain('Item 1');
      expect(result).toContain('Item 2');
      expect(result).toContain('Numbered 1');
      expect(result).toContain('Numbered 2');
      expect(result).not.toContain('-');
      expect(result).not.toContain('1.');
      expect(result).not.toContain('2.');
    });
  });

  describe('extractContributors function', () => {
    it('should extract contributors from activities', () => {
      const activities = [
        {
          id: 'activity1',
          $type: 'CustomFieldActivityItem',
          timestamp: Date.now() - 86400000,
          author: {
            id: 'user1',
            name: 'User One',
            fullName: 'User One',
            $type: 'User'
          },
          target: { id: 'issue1', $type: 'Issue' },
          field: { id: 'field1', name: 'Status', $type: 'CustomFilterField' },
          added: [{ id: 'added1', name: 'In Progress', $type: 'ActivityChange' }],
          removed: [{ id: 'removed1', name: 'Open', $type: 'ActivityChange' }]
        },
        {
          id: 'activity2',
          $type: 'CommentActivityItem',
          timestamp: Date.now() - 43200000,
          author: {
            id: 'user2',
            name: 'User Two',
            fullName: 'User Two',
            $type: 'User'
          },
          target: { id: 'comment1', text: 'Test comment', $type: 'IssueComment' }
        }
      ] as YouTrackTypes.ActivityItem[];

      const result = extractContributors(activities);
      
      expect(result).toContain('CONTRIBUTORS');
      expect(result).toContain('User One');
      expect(result).toContain('User Two');
      expect(result).toContain('changed Status');
      expect(result).toContain('commented');
    });

    it('should handle activities without authors', () => {
      const activities = [
        {
          id: 'activity1',
          $type: 'CustomFieldActivityItem',
          timestamp: Date.now(),
          target: { id: 'issue1', $type: 'Issue' },
          field: { id: 'field1', name: 'Status', $type: 'CustomFilterField' },
          added: [{ id: 'added1', name: 'In Progress', $type: 'ActivityChange' }],
          removed: [{ id: 'removed1', name: 'Open', $type: 'ActivityChange' }]
        }
      ] as unknown as YouTrackTypes.ActivityItem[];

      const result = extractContributors(activities);
      expect(result).toBeNull();
    });

    it('should handle empty activities array', () => {
      expect(extractContributors([])).toBeNull();
    });

    it('should include multiple actions by the same contributor', () => {
      const activities = [
        {
          id: 'activity1',
          $type: 'CustomFieldActivityItem',
          timestamp: Date.now() - 86400000,
          author: {
            id: 'user1',
            name: 'User One',
            fullName: 'User One',
            $type: 'User'
          },
          target: { id: 'issue1', $type: 'Issue' },
          field: { id: 'field1', name: 'Status', $type: 'CustomFilterField' },
          added: [{ id: 'added1', name: 'In Progress', $type: 'ActivityChange' }],
          removed: [{ id: 'removed1', name: 'Open', $type: 'ActivityChange' }]
        },
        {
          id: 'activity2',
          $type: 'CustomFieldActivityItem',
          timestamp: Date.now() - 43200000,
          author: {
            id: 'user1',
            name: 'User One',
            fullName: 'User One',
            $type: 'User'
          },
          target: { id: 'issue1', $type: 'Issue' },
          field: { id: 'field2', name: 'Priority', $type: 'CustomFilterField' },
          added: [{ id: 'added2', name: 'High', $type: 'ActivityChange' }],
          removed: [{ id: 'removed2', name: 'Normal', $type: 'ActivityChange' }]
        }
      ] as YouTrackTypes.ActivityItem[];

      const result = extractContributors(activities);
      
      expect(result).toContain('User One');
      expect(result).toContain('changed Status');
      expect(result).toContain('changed Priority');
    });
  });

  describe('formatActivities function', () => {
    it('should format activities with default options', () => {
      const activities = [
        {
          id: 'activity1',
          $type: 'CustomFieldActivityItem',
          timestamp: Date.now() - 86400000,
          author: {
            id: 'user1',
            name: 'User One',
            fullName: 'User One',
            $type: 'User'
          },
          target: { id: 'issue1', $type: 'Issue' },
          field: { id: 'field1', name: 'Status', $type: 'CustomFilterField' },
          added: [{ id: 'added1', name: 'In Progress', $type: 'ActivityChange' }],
          removed: [{ id: 'removed1', name: 'Open', $type: 'ActivityChange' }]
        }
      ] as YouTrackTypes.ActivityItem[];

      const result = formatActivities(activities);
      
      expect(result).toContain('ACTIVITY HISTORY');
      expect(result).toContain('User One');
      expect(result).toContain('Status');
      expect(result).toContain('Open → In Progress');
    });

    it('should limit activities based on maxActivities parameter', () => {
      const activities = Array.from({ length: 10 }, (_, i) => ({
        id: `activity${i}`,
        $type: 'CustomFieldActivityItem',
        timestamp: Date.now() - (i * 86400000),
        author: {
          id: `user${i}`,
          name: `User ${i}`,
          fullName: `User ${i}`,
          $type: 'User'
        },
        target: { id: 'issue1', $type: 'Issue' },
        field: { id: 'field1', name: 'Status', $type: 'CustomFilterField' },
        added: [{ id: `added${i}`, name: `Value ${i}`, $type: 'ActivityChange' }],
        removed: [{ id: `removed${i}`, name: `Previous ${i}`, $type: 'ActivityChange' }]
      })) as YouTrackTypes.ActivityItem[];

      const result = formatActivities(activities, 5);
      
      // Check that we have 5 activities plus header
      const countActivities = (result.match(/\d+\.\s+/g) || []).length;
      expect(countActivities).toBe(5);
      expect(result).toContain('[Only showing the 5 most recent activities]');
    });

    it('should handle empty activities array', () => {
      const result = formatActivities([]);
      expect(result).toContain('ACTIVITY HISTORY');
      expect(result).toContain('No activity records found');
    });

    it('should format comment activities correctly', () => {
      const activities = [
        {
          id: 'activity1',
          $type: 'CommentActivityItem',
          timestamp: Date.now() - 86400000,
          author: {
            id: 'user1',
            name: 'User One',
            fullName: 'User One',
            $type: 'User'
          },
          target: { 
            id: 'comment1', 
            text: 'This is a test comment', 
            $type: 'IssueComment' 
          }
        }
      ] as YouTrackTypes.ActivityItem[];

      const result = formatActivities(activities);
      
      expect(result).toContain('ACTIVITY HISTORY');
      expect(result).toContain('User One');
      expect(result).toContain('added a comment');
      expect(result).toContain('This is a test comment');
    });
  });

  describe('extractSprintInformation function', () => {
    it('should extract sprint information from issue custom fields', () => {
      // Use any to bypass type checking for testing private functions
      const issue = {
        id: 'issue1',
        idReadable: 'TEST-1',
        $type: 'Issue',
        summary: 'Test Issue',
        customFields: [
          {
            $type: 'CustomFieldValue',
            id: 'sprint-field',
            name: 'Sprint',
            value: {
              $type: 'AgileSprintValue',
              id: 'sprint1',
              name: 'Sprint 1',
              goal: 'Achieve MVP'
            }
          }
        ]
      } as any;

      const result = extractSprintInformation(issue);
      
      expect(result).toContain('SPRINT INFORMATION');
      expect(result).toContain('Sprint: Sprint 1');
      expect(result).toContain('Goal: Achieve MVP');
    });

    it('should handle when sprint is in a different field', () => {
      // Use any to bypass type checking for testing private functions
      const issue = {
        id: 'issue1',
        idReadable: 'TEST-1',
        $type: 'Issue',
        summary: 'Test Issue',
        customFields: [
          {
            $type: 'CustomFieldValue',
            id: 'sprint-field',
            name: 'Iteration',
            value: {
              $type: 'AgileSprintValue',
              id: 'sprint1',
              name: 'Iteration 1',
              goal: 'Complete Feature X'
            }
          }
        ]
      } as any;

      const result = extractSprintInformation(issue);
      
      expect(result).toContain('SPRINT INFORMATION');
      expect(result).toContain('Iteration: Iteration 1');
      expect(result).toContain('Goal: Complete Feature X');
    });

    it('should return null when no sprint information is found', () => {
      // Use any to bypass type checking for testing private functions
      const issue = {
        id: 'issue1',
        idReadable: 'TEST-1',
        $type: 'Issue',
        summary: 'Test Issue',
        customFields: [
          {
            $type: 'CustomFieldValue',
            id: 'status-field',
            name: 'Status',
            value: {
              $type: 'EnumFieldValue',
              id: 'status1',
              name: 'In Progress'
            }
          }
        ]
      } as any;

      const result = extractSprintInformation(issue);
      expect(result).toBeNull();
    });
  });

  describe('formatIssuesForAI function', () => {
    it('should handle empty issues array', () => {
      const result = formatIssuesForAI([]);
      expect(result).toContain('ISSUES SUMMARY');
      expect(result).toContain('No issues found');
    });

    it('should format single issue', () => {
      const issue = {
        id: 'issue1',
        idReadable: 'TEST-1',
        $type: 'Issue',
        summary: 'Test Issue',
        description: 'Test Description'
      } as any;

      const result = formatIssuesForAI([issue]);
      expect(result).toContain('ISSUES SUMMARY');
      expect(result).toContain('TEST-1');
      expect(result).toContain('Test Issue');
      expect(result).toContain('Test Description');
    });

    it('should format multiple issues with overview', () => {
      const issues = [
        {
          id: 'issue1',
          idReadable: 'TEST-1',
          $type: 'Issue',
          summary: 'First Issue'
        },
        {
          id: 'issue2',
          idReadable: 'TEST-2',
          $type: 'Issue',
          summary: 'Second Issue'
        },
        {
          id: 'issue3',
          idReadable: 'TEST-3',
          $type: 'Issue',
          summary: 'Third Issue'
        }
      ] as any[];

      const result = formatIssuesForAI(issues);
      expect(result).toContain('ISSUES SUMMARY');
      expect(result).toContain('TEST-1');
      expect(result).toContain('TEST-2');
      expect(result).toContain('TEST-3');
      expect(result).toContain('First Issue');
      expect(result).toContain('Second Issue');
      expect(result).toContain('Third Issue');
    });
  });

  describe('formatDate function', () => {
    it('should format timestamp to readable date', () => {
      const timestamp = 1620000000000; // May 3, 2021 (approx)
      const result = formatDate(timestamp);
      expect(result).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/); // YYYY-MM-DD HH:MM format
    });
  });

  describe('formatFileSize function', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 bytes');
      expect(formatFileSize(1)).toBe('1 byte');
      expect(formatFileSize(512)).toBe('512 bytes');
    });

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(10240)).toBe('10.0 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1048576)).toBe('1.0 MB');
      expect(formatFileSize(5242880)).toBe('5.0 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(formatFileSize(1073741824)).toBe('1.0 GB');
    });
  });

  describe('formatLinks function', () => {
    it('should format issue links correctly', () => {
      const links = [
        {
          $type: 'IssueLink',
          direction: 'OUTWARD',
          id: 'link1',
          linkType: {
            $type: 'IssueLinkType',
            id: 'relates',
            localizedName: 'Relates to'
          },
          issue: {
            id: 'issue2',
            idReadable: 'TEST-2',
            summary: 'Related Issue'
          }
        },
        {
          $type: 'IssueLink',
          direction: 'INWARD',
          id: 'link2',
          linkType: {
            $type: 'IssueLinkType',
            id: 'subtask',
            localizedName: 'Subtask of',
            targetToSource: 'Related to'
          },
          issue: {
            id: 'issue3',
            idReadable: 'TEST-3',
            summary: 'Parent Issue'
          }
        }
      ] as unknown as YouTrackTypes.IssueLink[];

      const result = formatLinks(links);
      
      expect(result).toContain('LINKED ISSUES');
      expect(result).toContain('Relates to');
      expect(result).toContain('Related to');
      expect(result).toContain('TEST-2');
      expect(result).toContain('TEST-3');
      expect(result).toContain('Related Issue');
      expect(result).toContain('Parent Issue');
    });

    it('should handle empty links array', () => {
      const result = formatLinks([]);
      expect(result).toContain('LINKED ISSUES');
      expect(result).toContain('No linked issues found');
    });
  });

  describe('getLinkRelationName function', () => {
    it('should format outward link relation correctly', () => {
      const link = {
        $type: 'IssueLink',
        direction: 'OUTWARD',
        linkType: {
          $type: 'IssueLinkType',
          id: 'relates',
          localizedName: 'Relates to'
        }
      } as YouTrackTypes.IssueLink;

      expect(getLinkRelationName(link)).toBe('Relates to');
    });

    it('should format inward link relation correctly', () => {
      const link = {
        $type: 'IssueLink',
        direction: 'INWARD',
        linkType: {
          $type: 'IssueLinkType',
          id: 'relates',
          localizedName: 'Relates to',
          targetToSource: 'Related to'
        }
      } as YouTrackTypes.IssueLink;

      expect(getLinkRelationName(link)).toBe('Related to');
    });

    it('should handle unknown directions', () => {
      const link = {
        $type: 'IssueLink',
        direction: 'UNKNOWN' as any,
        linkType: {
          $type: 'IssueLinkType',
          id: 'relates',
          localizedName: 'Relates to'
        }
      } as YouTrackTypes.IssueLink;

      expect(getLinkRelationName(link)).toBe('Relates to');
    });
  });

  describe('formatComments function', () => {
    it('should format comments correctly', () => {
      const comments = [
        {
          $type: 'IssueComment',
          id: 'comment1',
          text: 'First comment',
          created: Date.now() - 86400000,
          author: {
            id: 'user1',
            name: 'User One',
            fullName: 'User One',
            $type: 'User'
          }
        },
        {
          $type: 'IssueComment',
          id: 'comment2',
          text: 'Second comment with markdown **bold**',
          created: Date.now() - 43200000,
          author: {
            id: 'user2',
            name: 'User Two',
            fullName: 'User Two',
            $type: 'User'
          }
        }
      ] as YouTrackTypes.IssueComment[];

      const result = formatComments(comments);
      
      expect(result).toContain('COMMENTS');
      expect(result).toContain('User One');
      expect(result).toContain('User Two');
      expect(result).toContain('First comment');
      expect(result).toContain('Second comment with markdown **bold**');
    });

    it('should handle empty comments array', () => {
      const result = formatComments([]);
      expect(result).toContain('COMMENTS');
      expect(result).toContain('No comments found');
    });

    it('should strip markdown when requested', () => {
      const comments = [
        {
          $type: 'IssueComment',
          id: 'comment1',
          text: '# Comment with markdown\n\n**Bold text**',
          created: Date.now(),
          author: {
            id: 'user1',
            name: 'User One',
            fullName: 'User One',
            $type: 'User'
          }
        }
      ] as YouTrackTypes.IssueComment[];

      const result = formatComments(comments, { preserveMarkdown: false });
      
      expect(result).toContain('Comment with markdown');
      expect(result).toContain('Bold text');
      expect(result).not.toContain('# Comment with markdown');
      expect(result).not.toContain('**Bold text**');
    });

    it('should truncate long comments when requested', () => {
      const longText = 'A'.repeat(3000);
      const comments = [
        {
          $type: 'IssueComment',
          id: 'comment1',
          text: longText,
          created: Date.now(),
          author: {
            id: 'user1',
            name: 'User One',
            fullName: 'User One',
            $type: 'User'
          }
        }
      ] as YouTrackTypes.IssueComment[];

      const result = formatComments(comments, { maxTextLength: 500 });
      
      expect(result.length).toBeLessThan(longText.length);
      expect(result).toContain('[... Content truncated ...]');
    });
  });

  describe('formatAttachments function', () => {
    it('should format attachments correctly', () => {
      const attachments = [
        {
          $type: 'IssueAttachment',
          id: 'attachment1',
          name: 'screenshot.png',
          mimeType: 'image/png',
          size: 1024 * 100 // 100 KB
        },
        {
          $type: 'IssueAttachment',
          id: 'attachment2',
          name: 'document.pdf',
          mimeType: 'application/pdf',
          size: 1024 * 1024 // 1 MB
        }
      ] as YouTrackTypes.IssueAttachment[];

      const result = formatAttachments(attachments);
      
      expect(result).toContain('ATTACHMENTS');
      expect(result).toContain('screenshot.png');
      expect(result).toContain('document.pdf');
      expect(result).toContain('image/png');
      expect(result).toContain('application/pdf');
      expect(result).toContain('100.0 KB');
      expect(result).toContain('1.0 MB');
    });

    it('should handle empty attachments array', () => {
      const result = formatAttachments([]);
      expect(result).toContain('ATTACHMENTS');
      expect(result).toContain('No attachments found');
    });
  });

  describe('formatPeriodValue function', () => {
    it('should format period values correctly', () => {
      expect(formatPeriodValue('PT15M')).toBe('15 minutes');
      expect(formatPeriodValue('PT1H')).toBe('1 hour');
      expect(formatPeriodValue('PT2H30M')).toBe('2 hours 30 minutes');
      expect(formatPeriodValue('P1D')).toBe('1 day');
      expect(formatPeriodValue('P2W')).toBe('2 weeks');
    });

    it('should handle invalid period values', () => {
      expect(formatPeriodValue('invalid')).toBe('invalid');
      expect(formatPeriodValue('')).toBe('');
    });
  });

  describe('formatBasicInfo function', () => {
    it('should format basic issue information correctly', () => {
      const issue = {
        id: 'issue1',
        idReadable: 'TEST-1',
        summary: 'Test Issue',
        created: Date.now() - 86400000,
        updated: Date.now(),
        resolved: null,
        reporter: {
          id: 'user1',
          name: 'Reporter',
          fullName: 'Test Reporter',
          email: 'reporter@example.com',
          $type: 'User'
        },
        project: {
          id: 'project1',
          name: 'Test Project',
          shortName: 'TEST',
          $type: 'Project'
        }
      } as YouTrackTypes.Issue;

      const result = formatBasicInfo(issue);
      
      expect(result).toContain('BASIC INFO');
      expect(result).toContain('TEST-1');
      expect(result).toContain('Test Issue');
      expect(result).toContain('Test Reporter');
      expect(result).toContain('reporter@example.com');
      expect(result).toContain('Test Project');
      expect(result).toContain('TEST');
      expect(result).toContain('Resolved: No');
    });

    it('should handle resolved issues correctly', () => {
      const issue = {
        id: 'issue1',
        idReadable: 'TEST-1',
        summary: 'Test Issue',
        created: Date.now() - 86400000,
        updated: Date.now(),
        resolved: Date.now() - 43200000,
      } as YouTrackTypes.Issue;

      const result = formatBasicInfo(issue);
      
      expect(result).toContain('BASIC INFO');
      expect(result).toContain('Resolved: Yes');
    });

    it('should handle missing fields gracefully', () => {
      const minimalIssue = {
        id: 'issue1',
      } as YouTrackTypes.Issue;

      const result = formatBasicInfo(minimalIssue);
      
      expect(result).toContain('BASIC INFO');
      expect(result).toContain('ID: issue1');
      expect(result).toContain('No summary provided');
    });
  });

  describe('formatCustomFields function', () => {
    it('should format custom fields with priority ordering', () => {
      const customFields = [
        {
          $type: 'SingleEnumIssueCustomField',
          id: 'field1',
          name: 'Type',
          value: {
            id: 'type1',
            name: 'Bug',
            $type: 'EnumValue'
          }
        },
        {
          $type: 'SingleEnumIssueCustomField',
          id: 'field2',
          name: 'Priority',
          value: {
            id: 'priority1',
            name: 'High',
            $type: 'EnumValue'
          }
        },
        {
          $type: 'SingleEnumIssueCustomField',
          id: 'field3',
          name: 'OtherField',
          value: {
            id: 'value1',
            name: 'Value',
            $type: 'EnumValue'
          }
        }
      ] as unknown as YouTrackTypes.AnyIssueCustomField[];

      const priorityFields = ['Type', 'Priority'];
      
      const result = formatCustomFields(customFields, priorityFields);
      
      expect(result).toContain('CUSTOM FIELDS');
      
      // Check priority ordering
      const typePos = result.indexOf('Type:');
      const priorityPos = result.indexOf('Priority:');
      const otherPos = result.indexOf('OtherField:');
      
      expect(typePos).toBeLessThan(priorityPos);
      expect(priorityPos).toBeLessThan(otherPos);
    });

    it('should format different custom field types correctly', () => {
      const customFields = [
        {
          $type: 'SingleEnumIssueCustomField',
          id: 'field1',
          name: 'Type',
          value: {
            id: 'type1',
            name: 'Bug',
            $type: 'EnumValue'
          }
        },
        {
          $type: 'StateIssueCustomField',
          id: 'field2',
          name: 'State',
          value: {
            id: 'state1',
            name: 'Fixed',
            isResolved: true,
            $type: 'StateValue'
          }
        },
        {
          $type: 'SingleUserIssueCustomField',
          id: 'field3',
          name: 'Assignee',
          value: {
            id: 'user1',
            name: 'assignee',
            fullName: 'Test Assignee',
            email: 'assignee@example.com',
            $type: 'User'
          }
        }
      ] as unknown as YouTrackTypes.AnyIssueCustomField[];
      
      const result = formatCustomFields(customFields);
      
      expect(result).toContain('CUSTOM FIELDS');
      expect(result).toContain('Type: Bug');
      expect(result).toContain('State: Fixed (Resolved)');
      expect(result).toContain('Assignee: Test Assignee (assignee@example.com)');
    });

    it('should handle fields with no value', () => {
      const customFields = [
        {
          $type: 'SingleEnumIssueCustomField',
          id: 'field1',
          name: 'EmptyField',
          value: null
        }
      ] as unknown as YouTrackTypes.AnyIssueCustomField[];
      
      const result = formatCustomFields(customFields);
      
      expect(result).toContain('CUSTOM FIELDS');
      expect(result).toContain('EmptyField: Not set');
    });
  });

  describe('formatIssuesOverview function', () => {
    it('should format issues overview correctly', () => {
      const issues = [
        {
          id: 'issue1',
          idReadable: 'TEST-1',
          summary: 'First Issue',
          description: 'First Description'
        },
        {
          id: 'issue2',
          idReadable: 'TEST-2',
          summary: 'Second Issue',
          description: 'Second Description'
        }
      ] as YouTrackTypes.Issue[];

      const result = formatIssuesOverview(issues);
      
      expect(result).toContain('ISSUES SUMMARY');
      expect(result).toContain('Total Issues: 2');
      expect(result).toContain('TEST-1');
      expect(result).toContain('TEST-2');
      expect(result).toContain('First Issue');
      expect(result).toContain('Second Issue');
    });

    it('should handle empty issues array', () => {
      const result = formatIssuesOverview([]);
      expect(result).toContain('ISSUES SUMMARY');
      expect(result).toContain('Total Issues: 0');
      expect(result).toContain('No issues found');
    });
  });

  describe('formatIssueForAI function', () => {
    it('should handle errors gracefully', () => {
      // Cause an error by passing an undefined issue object
      const result = formatIssueForAI(undefined as any);
      expect(result).toContain('ERROR FORMATTING ISSUE');
    });

    it('should include raw data when requested', () => {
      const issue = {
        id: 'issue1',
        idReadable: 'TEST-1',
        summary: 'Test Issue',
      } as YouTrackTypes.Issue;

      const result = formatIssueForAI(issue, { includeRawData: true });
      
      expect(result).toContain('RAW DATA');
      expect(result).toContain('"id": "issue1"');
      expect(result).toContain('"idReadable": "TEST-1"');
      expect(result).toContain('"summary": "Test Issue"');
    });
  });

  describe('extractCommentsFromActivities function', () => {
    it('should extract comments from CommentActivityItem entries', () => {
      const activities = [
        {
          id: 'activity1',
          $type: 'CommentActivityItem',
          timestamp: Date.now() - 86400000,
          author: {
            id: 'user1',
            name: 'User One',
            fullName: 'User One',
            $type: 'User'
          },
          target: { 
            id: 'comment1', 
            text: 'This is a test comment', 
            $type: 'IssueComment' 
          }
        },
        {
          id: 'activity2',
          $type: 'CustomFieldActivityItem',
          timestamp: Date.now() - 43200000,
          author: {
            id: 'user2',
            name: 'User Two',
            fullName: 'User Two',
            $type: 'User'
          },
          field: {
            id: 'field1',
            name: 'Status',
            $type: 'CustomFilterField'
          }
        },
        {
          id: 'activity3',
          $type: 'CommentActivityItem',
          timestamp: Date.now() - 21600000,
          author: {
            id: 'user3',
            name: 'User Three',
            fullName: 'User Three',
            $type: 'User'
          },
          added: {
            id: 'comment2',
            text: 'This is another test comment',
            created: Date.now() - 21600000,
            author: {
              id: 'user3',
              name: 'User Three',
              fullName: 'User Three',
              $type: 'User'
            },
            $type: 'IssueComment'
          }
        }
      ] as YouTrackTypes.ActivityItem[];

      const comments = extractCommentsFromActivities(activities);
      
      expect(comments.length).toBe(2);
      expect(comments[0].id).toBe('comment1');
      expect(comments[0].text).toBe('This is a test comment');
      expect(comments[1].id).toBe('comment2');
      expect(comments[1].text).toBe('This is another test comment');
    });

    it('should return empty array when no activities are provided', () => {
      const comments = extractCommentsFromActivities([]);
      expect(comments).toEqual([]);
    });

    it('should handle array of added items in CommentActivityItem', () => {
      const activities = [
        {
          id: 'activity1',
          $type: 'CommentActivityItem',
          timestamp: Date.now(),
          author: {
            id: 'user1',
            name: 'User One',
            fullName: 'User One',
            $type: 'User'
          },
          added: [
            {
              id: 'comment1',
              text: 'First comment in array',
              created: Date.now() - 86400000,
              $type: 'IssueComment'
            },
            {
              id: 'comment2',
              text: 'Second comment in array',
              created: Date.now() - 43200000,
              $type: 'IssueComment'
            }
          ]
        }
      ] as YouTrackTypes.ActivityItem[];

      const comments = extractCommentsFromActivities(activities);
      
      expect(comments.length).toBe(2);
      expect(comments[0].text).toBe('First comment in array');
      expect(comments[1].text).toBe('Second comment in array');
    });
  });
}); 