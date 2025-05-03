import { mapIssueToAIReadableText } from '../../../src/utils/issue-mapper';
import { issueFixtures } from '../../fixtures';
import { Issue } from '../../../src/types/youtrack';

describe('Issue Mapper', () => {
  describe('mapIssueToAIReadableText', () => {
    it('should map basic issue properties correctly', () => {
      // Get a sample issue from fixtures
      const issue = { ...issueFixtures.issues[0] };
      
      // Add some additional properties to match the expected format
      const extendedIssue = {
        ...issue,
        idReadable: `PROJECT-${issue.id}`,
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        },
        created: new Date('2023-04-15T10:30:00.000Z').getTime(),
        updated: new Date('2023-04-16T14:45:00.000Z').getTime(),
        reporter: {
          id: 'user-1',
          name: 'John Doe',
          fullName: 'John Doe',
          login: 'johndoe',
          email: 'john@example.com',
          $type: 'User'
        }
      } as Issue;
      
      // Call the function
      const result = mapIssueToAIReadableText(extendedIssue);
      
      // Check the result contains the expected properties
      expect(result).toContain(`Issue ID: ${issue.id}`);
      expect(result).toContain(`ID Readable: PROJECT-${issue.id}`);
      expect(result).toContain(`Summary: ${issue.summary}`);
      expect(result).toContain('Status: Open');
      expect(result).toContain('Project: Test Project (TEST)');
      expect(result).toContain('Created:');
      expect(result).toContain('Updated:');
      expect(result).toContain('Reporter: John Doe (john@example.com)');
      expect(result).toContain(`Description:\n${issue.description}`);
    });

    it('should handle resolved issues', () => {
      // Get a sample issue and mark it as resolved
      const issue = { 
        ...issueFixtures.issues[0],
        resolved: true,
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        }
      } as Issue;
      
      const result = mapIssueToAIReadableText(issue);
      
      expect(result).toContain('Status: Resolved');
      expect(result).toContain('Resolved:');
    });

    it('should handle assignees correctly', () => {
      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        },
        // Using assignees property which is not in the interface
        assignees: [
          { id: 'user-2', name: 'Alice Smith', fullName: 'Alice Smith', login: 'alice', $type: 'User' },
          { id: 'user-3', name: 'Bob Johnson', fullName: 'Bob Johnson', login: 'bob', $type: 'User' }
        ]
      } as any; // Using any to bypass type checking
      
      const result = mapIssueToAIReadableText(issue);
      
      expect(result).toContain('Assignee(s): Alice Smith, Bob Johnson');
    });

    it('should handle single assignee format', () => {
      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        },
        // Using assignee property which is not in the interface
        assignee: { id: 'user-2', name: 'Alice Smith', fullName: 'Alice Smith', login: 'alice', $type: 'User' }
      } as any; // Using any to bypass type checking
      
      const result = mapIssueToAIReadableText(issue);
      
      expect(result).toContain('Assignee(s): Alice Smith');
    });

    it('should handle updater information', () => {
      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        },
        updater: { id: 'user-4', name: 'Admin User', fullName: 'Admin User', login: 'admin', $type: 'User' },
        updated: new Date('2023-04-16T14:45:00.000Z').getTime()
      } as Issue;
      
      const result = mapIssueToAIReadableText(issue);
      
      expect(result).toContain('Last Updated By: Admin User');
    });

    it('should handle draft status', () => {
      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        },
        isDraft: true
      } as Issue;
      
      const result = mapIssueToAIReadableText(issue);
      
      expect(result).toContain('Draft: Yes');
    });

    it('should handle priority and type', () => {
      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        },
        // These properties don't exist in the interface
        priority: { id: 'priority-1', name: 'Critical', $type: 'EnumBundleElement' },
        type: { id: 'type-1', name: 'Bug', $type: 'EnumBundleElement' }
      } as any; // Using any to bypass type checking
      
      const result = mapIssueToAIReadableText(issue);
      
      expect(result).toContain('Priority: Critical');
      expect(result).toContain('Type: Bug');
    });

    it('should handle custom fields', () => {
      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        },
        fields: [
          { id: 'field-1', name: 'Story points', value: 5 },
          { id: 'field-2', name: 'Environment', value: 'Production' },
          { 
            id: 'field-3', 
            name: 'Team', 
            value: [
              { id: 'team-1', name: 'Frontend' }, 
              { id: 'team-2', name: 'Backend' }
            ] 
          },
          { id: 'field-4', name: 'Empty field', value: null }
        ]
      } as Issue;
      
      const result = mapIssueToAIReadableText(issue);
      
      expect(result).toContain('Story points: 5');
      expect(result).toContain('Environment: Production');
      expect(result).toContain('Team: Frontend, Backend');
      expect(result).toContain('Empty field: Not set');
      expect(result).toContain('Story Points: 5');
    });

    it('should handle tags', () => {
      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        },
        tags: [
          { id: 'tag-1', name: 'regression', $type: 'IssueTag' }, 
          { id: 'tag-2', name: 'frontend', $type: 'IssueTag' }
        ]
      } as Issue;
      
      const result = mapIssueToAIReadableText(issue);
      
      expect(result).toContain('Tags: regression, frontend');
    });

    it('should handle due date', () => {
      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        },
        // This property doesn't exist in the interface
        dueDate: new Date('2023-05-01T00:00:00.000Z').getTime()
      } as any; // Using any to bypass type checking
      
      const result = mapIssueToAIReadableText(issue);
      
      expect(result).toContain('Due Date:');
    });

    it('should handle time tracking', () => {
      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        },
        // This property doesn't exist in the interface
        timeTracking: {
          estimate: '4h',
          spent: '3h 30m'
        }
      } as any; // Using any to bypass type checking
      
      const result = mapIssueToAIReadableText(issue);
      
      expect(result).toContain('Time Tracking:');
      expect(result).toContain('Estimate: 4h');
      expect(result).toContain('Spent Time: 3h 30m');
    });

    it('should handle sprints', () => {
      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        },
        // This property doesn't exist in the interface
        sprints: [
          { id: 'sprint-1', name: 'Sprint 1', $type: 'Sprint' }, 
          { id: 'sprint-2', name: 'Sprint 2', $type: 'Sprint' }
        ]
      } as any; // Using any to bypass type checking
      
      const result = mapIssueToAIReadableText(issue);
      
      expect(result).toContain('Sprints: Sprint 1, Sprint 2');
    });

    it('should handle sprint as a custom field', () => {
      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        },
        fields: [
          { 
            id: 'field-5', 
            name: 'Sprint', 
            value: { id: 'sprint-3', name: 'Sprint 3' } 
          }
        ]
      } as Issue;
      
      const result = mapIssueToAIReadableText(issue);
      
      expect(result).toContain('Sprint: Sprint 3');
    });

    it('should handle activities', () => {
      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        }
      } as Issue;
      
      // Using any type to bypass strict type checking for this test
      const activities = [
        {
          id: 'act1',
          timestamp: new Date('2023-04-16T10:00:00.000Z').getTime(),
          author: { id: 'user-1', fullName: 'John Doe', login: 'johndoe', name: 'John Doe', $type: 'User' },
          category: { id: 'StateChanged', $type: 'Category' },
          // Using a string that will work with toLowerCase() 
          field: 'State',
          added: [{ id: 'state-2', name: 'In Progress', $type: 'State' }],
          removed: [{ id: 'state-1', name: 'Open', $type: 'State' }],
          $type: 'ActivityItem',
          oldValue: 'Open',
          newValue: 'In Progress'
        },
        {
          id: 'act2',
          timestamp: new Date('2023-04-17T14:30:00.000Z').getTime(),
          author: { id: 'user-2', fullName: 'Alice Smith', login: 'alice', name: 'Alice Smith', $type: 'User' },
          category: { id: 'CommentsAdded', $type: 'Category' },
          field: 'Comment',
          added: [{ id: 'comment-1', text: 'This is a comment', $type: 'Comment' }],
          $type: 'ActivityItem',
          commentText: 'This is a comment'
        }
      ] as any[]; // Using any[] to bypass type checking
      
      const result = mapIssueToAIReadableText(issue, activities);
      
      expect(result).toContain('Activity History:');
      expect(result).toContain('John Doe');
      expect(result).toContain('Alice Smith');
      expect(result).toContain('Changed State from');
      expect(result).toContain('In Progress');
    });
  });
}); 