import fs from 'fs';
import path from 'path';
import * as YouTrackTypes from '../../../src/types/youtrack';
import { formatIssueForAI } from '../../../src/utils/issue-formatter';

// Directly import the module to access private functions for testing
// This approach uses the fact that in Jest, we can access non-exported functions for testing
const issueFormatterModule = require('../../../src/utils/issue-formatter');

describe('Issue Formatter - Private Function Tests', () => {
  describe('stripMarkdown function', () => {
    it('should strip basic markdown formatting', () => {
      const markdown = '# Heading\n\n**Bold text**\n*Italic text*\n';
      const result = issueFormatterModule.stripMarkdown(markdown);
      expect(result).toContain('Heading');
      expect(result).toContain('Bold text');
      expect(result).toContain('Italic text');
      expect(result).not.toContain('#');
      expect(result).not.toContain('**');
      expect(result).not.toContain('*');
    });

    it('should handle code blocks and links', () => {
      const markdown = '```typescript\nconst x = 1;\n```\n[Link text](https://example.com)';
      const result = issueFormatterModule.stripMarkdown(markdown);
      expect(result).toContain('const x = 1;');
      expect(result).toContain('Link text');
      expect(result).not.toContain('```');
      expect(result).not.toContain('[Link text]');
      expect(result).not.toContain('(https://example.com)');
    });

    it('should handle empty or non-markdown text', () => {
      expect(issueFormatterModule.stripMarkdown('')).toBe('');
      expect(issueFormatterModule.stripMarkdown('Plain text without markdown')).toBe('Plain text without markdown');
    });
  });

  describe('formatFileSize function', () => {
    it('should format bytes correctly', () => {
      expect(issueFormatterModule.formatFileSize(0)).toBe('0 bytes');
      expect(issueFormatterModule.formatFileSize(1)).toBe('1 byte');
      expect(issueFormatterModule.formatFileSize(512)).toBe('512 bytes');
    });

    it('should format kilobytes correctly', () => {
      expect(issueFormatterModule.formatFileSize(1024)).toBe('1.0 KB');
      expect(issueFormatterModule.formatFileSize(1536)).toBe('1.5 KB');
      expect(issueFormatterModule.formatFileSize(10240)).toBe('10.0 KB');
    });

    it('should format megabytes correctly', () => {
      expect(issueFormatterModule.formatFileSize(1048576)).toBe('1.0 MB');
      expect(issueFormatterModule.formatFileSize(5242880)).toBe('5.0 MB');
      expect(issueFormatterModule.formatFileSize(15728640)).toBe('15.0 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(issueFormatterModule.formatFileSize(1073741824)).toBe('1.0 GB');
      expect(issueFormatterModule.formatFileSize(3221225472)).toBe('3.0 GB');
    });

    it('should handle large file sizes', () => {
      expect(issueFormatterModule.formatFileSize(1099511627776)).toBe('1.0 TB'); // 1 TB
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

      const result = issueFormatterModule.extractContributors(activities);
      
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

      const result = issueFormatterModule.extractContributors(activities);
      expect(result).toBeNull();
    });

    it('should handle empty activities array', () => {
      expect(issueFormatterModule.extractContributors([])).toBeNull();
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

      const result = issueFormatterModule.formatActivities(activities);
      
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

      const result = issueFormatterModule.formatActivities(activities, 5);
      
      // Check that we have 5 activities plus header
      const countActivities = (result.match(/\d+\.\s+/g) || []).length;
      expect(countActivities).toBe(5);
      expect(result).toContain('[Only showing the 5 most recent activities]');
    });

    it('should handle empty activities array', () => {
      const result = issueFormatterModule.formatActivities([]);
      expect(result).toContain('ACTIVITY HISTORY');
      expect(result).toContain('No activity records found');
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

      const result = issueFormatterModule.extractSprintInformation(issue);
      
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

      const result = issueFormatterModule.extractSprintInformation(issue);
      
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

      const result = issueFormatterModule.extractSprintInformation(issue);
      expect(result).toBeNull();
    });

    it('should handle issues without custom fields', () => {
      // Use any to bypass type checking for testing private functions
      const issue = {
        id: 'issue1',
        idReadable: 'TEST-1',
        $type: 'Issue',
        summary: 'Test Issue'
      } as any;

      const result = issueFormatterModule.extractSprintInformation(issue);
      expect(result).toBeNull();
    });
  });
}); 