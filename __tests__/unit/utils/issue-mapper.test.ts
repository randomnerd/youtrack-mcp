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
        // Add sprints directly to the issue
        sprints: [
          { id: 'sprint-1', name: 'Sprint 1' },
          { id: 'sprint-2', name: 'Sprint 2' }
        ]
      } as any;
      
      const result = mapIssueToAIReadableText(issue);
      
      expect(result).toContain('Sprints: Sprint 1, Sprint 2');
    });
    
    it('should handle sprints from custom fields', () => {
      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        },
        // Add sprint as a custom field
        fields: [
          { 
            id: 'field-1', 
            name: 'Sprint', 
            value: { id: 'sprint-1', name: 'Current Sprint' }
          }
        ]
      } as any;
      
      const result = mapIssueToAIReadableText(issue);
      
      expect(result).toContain('Sprint: Current Sprint');
    });

    it('should handle watchers', () => {
      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        },
        // Add watchers as an array
        watchers: [
          { id: 'user-5', fullName: 'David Williams', login: 'david' },
          { id: 'user-6', fullName: 'Emily Brown', login: 'emily' }
        ]
      } as any;
      
      const result = mapIssueToAIReadableText(issue);
      
      expect(result).toContain('Watchers: 2 (David Williams, Emily Brown)');
    });
    
    it('should handle watchers as hasStar property', () => {
      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        },
        // Add watchers as hasStar property
        watchers: {
          hasStar: true
        }
      } as any;
      
      const result = mapIssueToAIReadableText(issue);
      
      expect(result).toContain('Watched: Yes');
    });

    it('should handle linked issues', () => {
      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        },
        // Add linked issues
        links: [
          {
            linkType: { sourceToTarget: 'depends on', name: 'Dependency' },
            issues: [
              { id: 'issue-2', summary: 'Dependent issue' }
            ]
          },
          {
            linkType: { sourceToTarget: 'related to', name: 'Relation' },
            trimmedIssues: [
              { id: 'issue-3', summary: 'Related issue' }
            ]
          }
        ]
      } as any;
      
      const result = mapIssueToAIReadableText(issue);
      
      expect(result).toContain('Linked Issues:');
      expect(result).toContain('depends on: issue-2 (Dependent issue)');
      expect(result).toContain('related to: issue-3 (Related issue)');
    });

    it('should handle attachments', () => {
      const createdDate = new Date('2023-04-20T10:30:00.000Z');
      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        },
        // Add attachments
        attachments: [
          {
            name: 'screenshot.png',
            size: '250KB',
            created: createdDate.getTime(),
            author: { fullName: 'Jane Smith', login: 'jane' }
          }
        ]
      } as any;
      
      const result = mapIssueToAIReadableText(issue);
      
      expect(result).toContain('Attachments:');
      expect(result).toContain('screenshot.png (250KB)');
      expect(result).toContain('Added by Jane Smith');
      expect(result).toContain(createdDate.toLocaleString());
    });

    it('should handle activity history', () => {
      const timestamp1 = new Date('2023-04-18T09:00:00.000Z');
      const timestamp2 = new Date('2023-04-19T14:30:00.000Z');
      
      const activities = [
        {
          id: 'activity-1',
          $type: 'CustomFieldActivityItem',
          author: { fullName: 'Alice Smith', login: 'alice' },
          timestamp: timestamp1.getTime(),
          field: 'Status',
          oldValue: 'Open',
          newValue: 'In Progress'
        },
        {
          id: 'activity-2',
          $type: 'CustomFieldActivityItem',
          author: { fullName: 'Bob Johnson', login: 'bob' },
          timestamp: timestamp2.getTime(),
          field: 'Priority',
          oldValue: 'Normal',
          newValue: 'High'
        }
      ];
      
      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        }
      } as any;
      
      const result = mapIssueToAIReadableText(issue, activities as any);
      
      expect(result).toContain('Activity History:');
      expect(result).toContain(`Alice Smith (${timestamp1.toLocaleString()}): Changed Status from "Open" to "In Progress"`);
      expect(result).toContain(`Bob Johnson (${timestamp2.toLocaleString()}): Changed Priority from "Normal" to "High"`);
    });
    
    it('should handle stage change timeline', () => {
      const timestamp1 = new Date('2023-04-18T09:00:00.000Z');
      const timestamp2 = new Date('2023-04-20T16:45:00.000Z');
      
      const activities = [
        {
          id: 'activity-1',
          $type: 'CustomFieldActivityItem',
          author: { fullName: 'Alice Smith', login: 'alice' },
          timestamp: timestamp1.getTime(),
          field: 'stage',
          oldValue: 'Open',
          newValue: 'In Progress'
        },
        {
          id: 'activity-2',
          $type: 'CustomFieldActivityItem',
          author: { fullName: 'Bob Johnson', login: 'bob' },
          timestamp: timestamp2.getTime(),
          field: 'stage',
          oldValue: 'In Progress',
          newValue: 'Done'
        }
      ];
      
      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        }
      } as any;
      
      const result = mapIssueToAIReadableText(issue, activities as any);
      
      expect(result).toContain('Stage Change Timeline:');
      expect(result).toContain(`${timestamp1.toLocaleString()} - Open → In Progress (by Alice Smith)`);
      expect(result).toContain(`${timestamp2.toLocaleString()} - In Progress → Done (by Bob Johnson)`);
    });

    it('should detect actual workers when someone starts working on the issue', () => {
      const timestamp = new Date('2023-04-18T09:00:00.000Z');
      
      const activities = [
        {
          id: 'activity-1',
          $type: 'CustomFieldActivityItem',
          author: { fullName: 'Alice Smith', login: 'alice' },
          timestamp: timestamp.getTime(),
          field: 'state',
          oldValue: 'Open',
          newValue: 'In Progress'
        }
      ];
      
      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        }
      } as any;
      
      const result = mapIssueToAIReadableText(issue, activities as any);
      
      expect(result).toContain('Actual Work Assignees:');
      expect(result).toContain(`Alice Smith - Started working on ${timestamp.toLocaleString()}`);
    });

    it('should handle comments', () => {
      const timestamp = new Date('2023-04-19T11:20:00.000Z');
      
      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        },
        comments: [
          {
            id: 'comment-1',
            text: 'This is a test comment',
            created: timestamp.getTime(),
            author: { fullName: 'Alice Smith', login: 'alice' }
          }
        ]
      } as any;
      
      const result = mapIssueToAIReadableText(issue);
      
      expect(result).toContain('Comments:');
      expect(result).toContain('Alice Smith');
      expect(result).toContain(timestamp.toLocaleString());
      expect(result).toContain('This is a test comment');
    });

    it('should handle watchers as an array', () => {
      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        },
        watchers: [
          { id: 'user-1', fullName: 'John Doe', login: 'johndoe' },
          { id: 'user-2', fullName: 'Jane Smith', login: 'janesmith' }
        ]
      } as any;

      const result = mapIssueToAIReadableText(issue);
      
      expect(result).toContain('Watchers: 2 (John Doe, Jane Smith)');
    });

    it('should handle watchers as an object with hasStar property', () => {
      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        },
        watchers: { hasStar: true }
      } as any;

      const result = mapIssueToAIReadableText(issue);
      
      expect(result).toContain('Watched: Yes');
    });

    it('should handle linked issues with issues property', () => {
      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        },
        links: [
          {
            linkType: { 
              sourceToTarget: 'depends on',
              name: 'Dependency'
            },
            issues: [
              { id: 'DEP-1', summary: 'Dependency 1' },
              { id: 'DEP-2', summary: 'Dependency 2' }
            ]
          }
        ]
      } as any;

      const result = mapIssueToAIReadableText(issue);
      
      expect(result).toContain('Linked Issues:');
      expect(result).toContain('depends on: DEP-1 (Dependency 1), DEP-2 (Dependency 2)');
    });

    it('should handle linked issues with trimmedIssues property', () => {
      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        },
        links: [
          {
            direction: 'inward',
            trimmedIssues: [
              { id: 'PARENT-1', summary: 'Parent Issue' }
            ]
          }
        ]
      } as any;

      const result = mapIssueToAIReadableText(issue);
      
      expect(result).toContain('Linked Issues:');
      expect(result).toContain('inward: PARENT-1 (Parent Issue)');
    });

    it('should handle attachments with various properties', () => {
      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        },
        attachments: [
          { 
            name: 'screenshot.png', 
            size: '256KB', 
            author: { fullName: 'John Doe', login: 'johndoe' },
            created: new Date('2023-05-01T10:00:00Z').getTime()
          },
          { 
            name: 'document.pdf',
            author: { login: 'janedoe' }, // No fullName
            created: new Date('2023-05-02T11:00:00Z').getTime()
          },
          {
            name: 'unknown.txt' // No author or date
          }
        ]
      } as any;

      const result = mapIssueToAIReadableText(issue);
      
      expect(result).toContain('Attachments:');
      expect(result).toContain('screenshot.png (256KB) - Added by John Doe');
      expect(result).toContain('document.pdf (Unknown size) - Added by janedoe');
      expect(result).toContain('unknown.txt (Unknown size) - Added by Unknown on Unknown date');
    });

    it('should handle activity history', () => {
      const mockActivities = [
        {
          author: { fullName: 'John Doe', login: 'johndoe' },
          timestamp: new Date('2023-05-01T10:00:00Z').getTime(),
          field: 'Status',
          oldValue: 'Open',
          newValue: 'In Progress'
        },
        {
          author: { login: 'janedoe' }, // No fullName
          timestamp: new Date('2023-05-02T11:00:00Z').getTime(),
          field: 'Priority',
          oldValue: 'Normal',
          newValue: 'High'
        },
        {
          author: { fullName: 'Alice Smith', login: 'alice' },
          timestamp: new Date('2023-05-03T12:00:00Z').getTime(),
          removed: ['Tag1', 'Tag2'],
          field: 'Tags'
        },
        {
          author: { fullName: 'Bob Johnson', login: 'bob' },
          timestamp: new Date('2023-05-04T13:00:00Z').getTime(),
          added: ['Tag3', 'Tag4'],
          field: 'Tags'
        },
        {
          author: { fullName: 'Charlie Brown', login: 'charlie' },
          timestamp: new Date('2023-05-05T14:00:00Z').getTime(),
          targetMember: { field: { name: 'Type' } }
        }
      ] as any; // Cast to any to bypass type checking for test purposes

      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        }
      } as any;

      const result = mapIssueToAIReadableText(issue, mockActivities);
      
      expect(result).toContain('Activity History:');
      expect(result).toContain('John Doe');
      expect(result).toContain('Status from "Open" to "In Progress"');
      expect(result).toContain('janedoe');
      expect(result).toContain('Priority from "Normal" to "High"');
      expect(result).toContain('Alice Smith');
      expect(result).toContain('Removed Tags: "Tag1, Tag2"');
      expect(result).toContain('Bob Johnson');
      expect(result).toContain('Added Tags: "Tag3, Tag4"');
      expect(result).toContain('Charlie Brown');
      expect(result).toContain('Updated Type');
      
      // Also check for Stage Change Timeline
      expect(result).toContain('Stage Change Timeline:');
      expect(result).toContain('Open → In Progress (by John Doe)');
    });

    it('should track actual workers when state changes to In Progress', () => {
      const mockActivities = [
        {
          author: { fullName: 'John Doe', login: 'johndoe' },
          timestamp: new Date('2023-05-01T10:00:00Z').getTime(),
          field: 'State',
          oldValue: 'Open',
          newValue: 'In Progress'
        },
        {
          author: { fullName: 'Jane Smith', login: 'janesmith' },
          timestamp: new Date('2023-05-02T11:00:00Z').getTime(),
          field: 'Stage',
          oldValue: 'To Do',
          newValue: 'In work'
        }
      ] as any; // Cast to any to bypass type checking for test purposes

      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        }
      } as any;

      const result = mapIssueToAIReadableText(issue, mockActivities);
      
      expect(result).toContain('Actual Work Assignees:');
      expect(result).toContain('John Doe - Started working on');
      expect(result).toContain('Jane Smith - Started working on');
    });

    it('should handle comments with various properties', () => {
      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        },
        comments: [
          {
            text: 'This is a comment with author and date',
            author: { fullName: 'John Doe', login: 'johndoe' },
            created: new Date('2023-05-01T10:00:00Z').getTime()
          },
          {
            text: 'This is a comment with only login, no fullName',
            author: { login: 'janedoe' },
            created: new Date('2023-05-02T11:00:00Z').getTime()
          },
          {
            text: 'This is a comment with no date',
            author: { fullName: 'Alice Smith', login: 'alice' }
          },
          {
            author: { fullName: 'Bob Johnson', login: 'bob' },
            created: new Date('2023-05-04T13:00:00Z').getTime(),
            text: '',
            attachments: [
              { name: 'attachment1.jpg' },
              { name: 'attachment2.pdf' }
            ]
          },
          {
            // Empty comment with no text or attachments - should be skipped
          }
        ]
      } as any;

      const result = mapIssueToAIReadableText(issue);
      
      expect(result).toContain('Comments:');
      expect(result).toContain('John Doe');
      expect(result).toContain('This is a comment with author and date');
      expect(result).toContain('janedoe');
      expect(result).toContain('This is a comment with only login, no fullName');
      expect(result).toContain('Alice Smith');
      expect(result).toContain('This is a comment with no date');
      expect(result).toContain('Bob Johnson');
      expect(result).toContain('No text');
      expect(result).toContain('Attachments: attachment1.jpg, attachment2.pdf');
      
      // The empty comment should be skipped
      expect(result.match(/No text/g)).toHaveLength(1);
    });

    it('should show formatted contributors section', () => {
      const mockActivities = [
        {
          author: { fullName: 'John Doe', login: 'johndoe', id: 'user-1' },
          timestamp: new Date('2023-05-01T10:00:00Z').getTime(),
          field: 'Status',
          oldValue: 'Open',
          newValue: 'In Progress'
        },
        {
          author: { fullName: 'Jane Smith', login: 'janesmith', id: 'user-2' },
          timestamp: new Date('2023-05-02T11:00:00Z').getTime(),
          field: 'Priority',
          oldValue: 'Normal',
          newValue: 'High'
        }
      ] as any; // Cast to any to bypass type checking for test purposes

      const issue = {
        ...issueFixtures.issues[0],
        idReadable: `PROJECT-${issueFixtures.issues[0].id}`,
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        },
        reporter: {
          id: 'user-1',
          fullName: 'John Doe',
          login: 'johndoe',
          email: 'john@example.com'
        },
        assignee: { 
          id: 'user-2',
          fullName: 'Jane Smith', 
          login: 'janesmith', 
          email: 'jane@example.com'
        },
        created: new Date('2023-04-15T10:30:00.000Z').getTime(),
        updated: new Date('2023-04-16T14:45:00.000Z').getTime(),
        comments: [
          {
            text: 'This is a comment',
            author: { id: 'user-3', fullName: 'Bob Johnson', login: 'bob' },
            created: new Date('2023-05-03T12:00:00Z').getTime()
          }
        ]
      } as any;

      const result = mapIssueToAIReadableText(issue, mockActivities);
      
      expect(result).toContain('Issue Contributors');
      
      // John has multiple roles
      expect(result).toContain('John Doe (johndoe)');
      expect(result).toContain('Roles: Reporter, Activity Contributor, Stage Manager');
      
      // Jane has multiple roles 
      expect(result).toContain('Jane Smith (janesmith)');
      expect(result).toContain('Roles: Assignee, Activity Contributor');
      
      // Bob is just a commenter
      expect(result).toContain('Bob Johnson (bob)');
      expect(result).toContain('Roles: Commenter');
    });

    it('should handle visibility information', () => {
      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        },
        visibility: {
          $type: 'UnlimitedVisibility'
        }
      } as any;

      const result = mapIssueToAIReadableText(issue);
      
      expect(result).toContain('Visibility: UnlimitedVisibility');
    });

    it('should handle number in project information', () => {
      const issue = {
        ...issueFixtures.issues[0],
        project: { 
          id: 'project-1',
          name: 'Test Project', 
          shortName: 'TEST',
          $type: 'Project'
        },
        numberInProject: 123
      } as any;

      const result = mapIssueToAIReadableText(issue);
      
      expect(result).toContain('Number in Project: 123');
    });

    it('should handle missing properties gracefully', () => {
      // A very minimal issue with no optional properties
      const minimalIssue = {
        id: 'issue-1',
        summary: 'Minimal Issue',
        description: 'This is a minimal issue',
        resolved: false
      } as Issue;

      const result = mapIssueToAIReadableText(minimalIssue);
      
      // Should still contain basic info
      expect(result).toContain('Issue ID: issue-1');
      expect(result).toContain('Summary: Minimal Issue');
      expect(result).toContain('Status: Open');
      expect(result).toContain('Description:\nThis is a minimal issue');

      // Should not error on missing properties
      expect(() => mapIssueToAIReadableText(minimalIssue)).not.toThrow();
    });

    describe('Activity handling', () => {
      it('should include activity history when provided', () => {
        const issue = { 
          ...issueFixtures.issues[0],
          id: 'TEST-123',
          project: { name: 'Test Project', shortName: 'TEST' }
        } as Issue;
        
        const activities = [
          { 
            id: 'act-1', 
            $type: 'CustomFieldActivityItem', 
            timestamp: new Date('2023-04-20T10:00:00.000Z').getTime(),
            author: { id: 'user-1', login: 'user1', name: 'User One' },
            field: { name: 'State' },
            added: [{ name: 'In Progress' }],
            removed: [{ name: 'Open' }]
          },
          {
            id: 'act-2',
            $type: 'CommentActivityItem',
            timestamp: new Date('2023-04-21T11:00:00.000Z').getTime(),
            author: { id: 'user-2', login: 'user2', name: 'User Two' },
            added: [{ text: 'This is a comment' }]
          }
        ] as any[];
        
        const result = mapIssueToAIReadableText(issue, activities);
        
        expect(result).toContain('Activity History:');
        expect(result).toContain('State');
        expect(result).toContain('Open');
        expect(result).toContain('User One');
        expect(result).toContain('User Two');
        expect(result).toContain('comment');
      });
      
      it('should handle field changes in activities', () => {
        const issue = { 
          ...issueFixtures.issues[0],
          id: 'TEST-123',
          project: { name: 'Test Project', shortName: 'TEST' }
        } as Issue;
        
        const activities = [
          { 
            id: 'act-1', 
            $type: 'CustomFieldActivityItem', 
            timestamp: new Date('2023-04-20T10:00:00.000Z').getTime(),
            author: { id: 'user-1', login: 'user1', name: 'User One' },
            field: { name: 'Priority' },
            added: [{ name: 'Critical' }],
            removed: [{ name: 'Normal' }]
          }
        ] as any[];
        
        const result = mapIssueToAIReadableText(issue, activities);
        
        expect(result).toContain('Activity History:');
        expect(result).toContain('Priority');
        expect(result).toContain('Normal');
      });
      
      it('should handle activity with no author', () => {
        const issue = { 
          ...issueFixtures.issues[0],
          id: 'TEST-123',
          project: { name: 'Test Project', shortName: 'TEST' }
        } as Issue;
        
        const activities = [
          { 
            id: 'act-1', 
            $type: 'CustomFieldActivityItem', 
            timestamp: new Date('2023-04-20T10:00:00.000Z').getTime(),
            field: { name: 'State' },
            added: [{ name: 'In Progress' }],
            removed: [{ name: 'Open' }]
          }
        ] as any[];
        
        const result = mapIssueToAIReadableText(issue, activities);
        
        expect(result).toContain('Activity History:');
        expect(result).toContain('State');
        expect(result).toContain('Open');
      });
    });
    
    describe('Complex issue scenarios', () => {
      it('should format linked issues correctly', () => {
        const issue = { 
          ...issueFixtures.issues[0],
          project: { name: 'Test Project', shortName: 'TEST' },
          links: [
            {
              id: 'link-1',
              linkType: { id: 'type-1', name: 'relates to', sourceToTarget: 'relates to' },
              issues: [
                { id: 'related-1', idReadable: 'TEST-456', summary: 'Related issue 1' },
                { id: 'related-2', idReadable: 'TEST-789', summary: 'Related issue 2' }
              ]
            },
            {
              id: 'link-2',
              linkType: { id: 'type-2', name: 'blocks', sourceToTarget: 'blocks' },
              issues: [
                { id: 'blocked-1', idReadable: 'TEST-987', summary: 'Blocked issue' }
              ]
            }
          ]
        } as any;
        
        const result = mapIssueToAIReadableText(issue);
        
        expect(result).toContain('Linked Issues:');
        expect(result).toContain('relates to: TEST-456 (Related issue 1), TEST-789 (Related issue 2)');
        expect(result).toContain('blocks: TEST-987 (Blocked issue)');
      });
      
      it('should format linked issues with trimmedIssues property', () => {
        const issue = { 
          ...issueFixtures.issues[0],
          project: { name: 'Test Project', shortName: 'TEST' },
          links: [
            {
              id: 'link-1',
              linkType: { name: 'relates to', sourceToTarget: 'relates to' },
              trimmedIssues: [
                { id: 'related-1', idReadable: 'TEST-456', summary: 'Related issue 1' }
              ]
            }
          ]
        } as any;
        
        const result = mapIssueToAIReadableText(issue);
        
        expect(result).toContain('Linked Issues:');
        expect(result).toContain('relates to: TEST-456 (Related issue 1)');
      });
      
      it('should format multiple comments correctly', () => {
        const issue = { 
          ...issueFixtures.issues[0],
          project: { name: 'Test Project', shortName: 'TEST' },
          comments: [
            { 
              id: 'comment-1', 
              text: 'First comment', 
              author: { id: 'user-1', login: 'user1', name: 'User One' },
              created: new Date('2023-04-01T09:00:00.000Z').getTime()
            },
            {
              id: 'comment-2',
              text: 'Second comment with **markdown**',
              author: { id: 'user-2', login: 'user2', name: 'User Two' },
              created: new Date('2023-04-02T10:30:00.000Z').getTime()
            }
          ]
        } as any;
        
        const result = mapIssueToAIReadableText(issue);
        
        expect(result).toContain('Comments:');
        expect(result).toContain('User One');
        expect(result).toContain('First comment');
        expect(result).toContain('User Two');
        expect(result).toContain('Second comment with **markdown**');
      });
      
      it('should format multiple attachments correctly', () => {
        const issue = { 
          ...issueFixtures.issues[0],
          project: { name: 'Test Project', shortName: 'TEST' },
          attachments: [
            { 
              id: 'att-1', 
              name: 'screenshot.png', 
              size: 1024, 
              author: { id: 'user-1', login: 'user1', fullName: 'User One' },
              created: new Date('2023-04-05T11:00:00.000Z').getTime()
            },
            {
              id: 'att-2',
              name: 'document.pdf',
              size: 20480,
              author: { id: 'user-2', login: 'user2', fullName: 'User Two' },
              created: new Date('2023-04-06T13:30:00.000Z').getTime()
            }
          ]
        } as any;
        
        const result = mapIssueToAIReadableText(issue);
        
        expect(result).toContain('Attachments:');
        expect(result).toContain('screenshot.png');
        expect(result).toContain('document.pdf');
        expect(result).toContain('User One');
        expect(result).toContain('User Two');
      });
    });
    
    describe('Sprints, visibility, and watchers', () => {
      it('should handle sprint information', () => {
        const issue = { 
          ...issueFixtures.issues[0],
          project: { name: 'Test Project', shortName: 'TEST' },
          sprints: [
            { id: 'sprint-1', name: 'Sprint 1 (2023-Q2)' },
            { id: 'sprint-2', name: 'Sprint 2 (2023-Q2)' }
          ]
        } as any;
        
        const result = mapIssueToAIReadableText(issue);
        
        expect(result).toContain('Sprints: Sprint 1 (2023-Q2), Sprint 2 (2023-Q2)');
      });
      
      it('should handle sprint from custom fields', () => {
        const issue = { 
          ...issueFixtures.issues[0],
          project: { name: 'Test Project', shortName: 'TEST' },
          fields: [
            { name: 'Sprint', value: { name: 'Sprint 3 (2023-Q3)' } }
          ]
        } as any;
        
        const result = mapIssueToAIReadableText(issue);
        
        expect(result).toContain('Sprint: Sprint 3 (2023-Q3)');
      });
      
      it('should handle visibility settings', () => {
        const issue = { 
          ...issueFixtures.issues[0],
          project: { name: 'Test Project', shortName: 'TEST' },
          visibility: {
            $type: 'LimitedVisibility',
            permittedGroups: [
              { id: 'group-1', name: 'Developers' },
              { id: 'group-2', name: 'QA Team' }
            ]
          }
        } as any;
        
        const result = mapIssueToAIReadableText(issue);
        
        expect(result).toContain('Visibility: LimitedVisibility');
      });
      
      it('should handle watchers as array', () => {
        const issue = { 
          ...issueFixtures.issues[0],
          project: { name: 'Test Project', shortName: 'TEST' },
          watchers: [
            { id: 'user-1', login: 'user1', fullName: 'User One' },
            { id: 'user-2', login: 'user2', fullName: 'User Two' },
            { id: 'user-3', login: 'user3', fullName: 'User Three' }
          ]
        } as any;
        
        const result = mapIssueToAIReadableText(issue);
        
        expect(result).toContain('Watchers: 3');
        expect(result).toContain('User One');
        expect(result).toContain('User Two');
        expect(result).toContain('User Three');
      });
      
      it('should handle watchers as object with hasStar property', () => {
        const issue = { 
          ...issueFixtures.issues[0],
          project: { name: 'Test Project', shortName: 'TEST' },
          watchers: { hasStar: true }
        } as any;
        
        const result = mapIssueToAIReadableText(issue);
        
        expect(result).toContain('Watched: Yes');
      });
    });
    
    describe('Edge cases', () => {
      it('should handle missing project information', () => {
        const issue = { 
          ...issueFixtures.issues[0],
          // Explicitly remove project to test this case
          project: undefined
        } as Issue;
        
        const result = mapIssueToAIReadableText(issue);
        
        expect(result).toContain('Project: Unknown (N/A)');
      });
      
      it('should handle empty/null description', () => {
        const issue = { 
          ...issueFixtures.issues[0],
          project: { name: 'Test Project', shortName: 'TEST' },
          description: undefined
        } as Issue;
        
        const result = mapIssueToAIReadableText(issue);
        
        expect(result).toContain('Description:\nNo description');
      });
      
      it('should handle malformed dates', () => {
        const issue = { 
          ...issueFixtures.issues[0],
          project: { name: 'Test Project', shortName: 'TEST' },
          created: 'invalid-date',
          updated: null
        } as any;
        
        const result = mapIssueToAIReadableText(issue);
        
        // Should not crash and should handle gracefully
        expect(result).toContain('Created: Unknown');
        expect(result).toContain('Updated: Unknown');
      });
    });
  });
}); 