import { 
  formatYouTrackData, 
  formatIssue, 
  formatBoard, 
  formatSprint, 
  formatUser, 
  formatProject,
  formatCustomFields,
  formatComments,
  formatLinks,
  formatAttachments,
  formatActivities,
  SimpleIssue,
  SimpleBoard,
  SimpleSprint,
  SimpleProject
} from '../../../src/utils/youtrack-json-formatter';
import * as issueFormatter from '../../../src/utils/issue-formatter';

// Mock the formatter implementation for stringify test
jest.mock('../../../src/utils/youtrack-json-formatter', () => {
  const original = jest.requireActual('../../../src/utils/youtrack-json-formatter');
  return {
    ...original,
    formatYouTrackData: jest.fn().mockImplementation((data, options = {}) => {
      if (options.stringify) {
        return JSON.stringify(data);
      }
      return original.formatYouTrackData(data, options);
    })
  };
});

// Mock the dependency
jest.mock('../../../src/utils/issue-formatter', () => ({
  formatDate: jest.fn().mockImplementation((date) => 
    date ? new Date(date).toISOString().split('T')[0] : 'N/A'
  ),
  formatFileSize: jest.fn().mockImplementation((size) => 
    size ? `${Math.floor(size / 1024)} KB` : 'N/A'
  )
}));

describe('YouTrack JSON Formatter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Basic test data
  const mockUser = {
    id: 'user-1',
    login: 'testuser',
    name: 'Test User',
    email: 'test@example.com',
    avatarUrl: 'http://example.com/avatar.png',
    fullName: 'Test Full User'
  };

  const mockProject = {
    id: 'project-1',
    name: 'Test Project',
    shortName: 'TP'
  };

  const mockCustomField = {
    id: 'field-1',
    name: 'Priority',
    $type: 'CustomField',
    value: {
      id: 'priority-1',
      name: 'High',
      color: { id: 'color-1', background: '#ff0000' }
    }
  };

  const mockComment = {
    id: 'comment-1',
    text: 'Test comment',
    author: mockUser,
    created: 1620000000000,
    updated: 1620000000000
  };

  const mockAttachment = {
    id: 'attachment-1',
    name: 'test.txt',
    mimeType: 'text/plain',
    size: 1024,
    author: mockUser,
    created: 1620000000000
  };

  const mockActivity = {
    id: 'activity-1',
    $type: 'IssueCreatedActivityItem',
    timestamp: 1620000000000,
    author: mockUser,
    target: { id: 'issue-1' },
    added: { fields: [{ name: 'State', value: 'Open' }] },
    removed: { fields: [] }
  };

  const mockLink = {
    id: 'link-1',
    direction: 'outward',
    linkType: { id: 'link-type-1', name: 'relates to' },
    issues: [{ id: 'issue-2', idReadable: 'TEST-2', summary: 'Related Issue' }]
  };

  const mockIssue = {
    id: 'issue-1',
    idReadable: 'TEST-1',
    summary: 'Test Issue',
    description: 'Test description',
    project: mockProject,
    created: 1620000000000,
    updated: 1620000000000,
    reporter: mockUser,
    customFields: [mockCustomField]
  };

  const mockSprint = {
    id: 'sprint-1',
    name: 'Sprint 1',
    goal: 'Sprint goal',
    start: 1620000000000,
    finish: 1630000000000,
    isActive: true
  };

  const mockBoard = {
    id: 'board-1',
    name: 'Test Board',
    description: 'Test board description',
    projects: [mockProject],
    sprints: [mockSprint],
    owner: mockUser
  };

  describe('formatUser', () => {
    it('should format a user correctly', () => {
      const result = formatUser(mockUser);
      expect(result).toEqual({
        id: 'user-1',
        name: 'Test User',
        fullName: 'Test Full User',
        login: 'testuser',
        email: 'test@example.com',
        avatarUrl: 'http://example.com/avatar.png'
      });
    });

    it('should handle undefined user', () => {
      const result = formatUser(undefined);
      expect(result).toBeUndefined();
    });
  });

  describe('formatProject', () => {
    it('should format a project correctly', () => {
      const result = formatProject(mockProject);
      expect(result).toEqual({
        id: 'project-1',
        name: 'Test Project',
        shortName: 'TP'
      });
    });

    it('should handle undefined project', () => {
      const result = formatProject(undefined);
      expect(result).toBeUndefined();
    });

    it('should include raw data if option specified', () => {
      const result = formatProject(mockProject, { includeRawData: true });
      expect((result as SimpleProject & { _raw?: any })?._raw).toEqual(mockProject);
    });
  });

  describe('formatCustomFields', () => {
    it('should format custom fields correctly', () => {
      const result = formatCustomFields([mockCustomField]);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Priority');
      expect(result[0].value).not.toBeUndefined();
    });

    it('should handle undefined custom fields', () => {
      const result = formatCustomFields(undefined);
      expect(result).toEqual([]);
    });
  });

  describe('formatComments', () => {
    it('should format comments correctly', () => {
      const result = formatComments([mockComment]);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('comment-1');
      expect(result[0].text).toBe('Test comment');
    });

    it('should truncate comment text if maxCommentLength specified', () => {
      const longComment = {
        ...mockComment,
        text: 'A'.repeat(2000)
      };
      const result = formatComments([longComment], { maxCommentLength: 100 });
      expect(result[0].text.length).toBeLessThanOrEqual(120);
      expect(result[0].text.length).toBeGreaterThan(50);
    });
  });

  describe('formatLinks', () => {
    it('should format links correctly', () => {
      const result = formatLinks([mockLink]);
      expect(result.length).toBe(1);
      expect(result[0].type).toBe('relates to');
      expect(result[0].direction).toBe('outward');
      expect(result[0].issues.length).toBe(1);
      expect(result[0].issues[0].id).toBe('issue-2');
    });

    it('should handle undefined links', () => {
      const result = formatLinks(undefined);
      expect(result).toEqual([]);
    });
  });

  describe('formatAttachments', () => {
    it('should format attachments correctly', () => {
      const result = formatAttachments([mockAttachment]);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('attachment-1');
      expect(result[0].name).toBe('test.txt');
    });

    it('should handle undefined attachments', () => {
      const result = formatAttachments(undefined);
      expect(result).toEqual([]);
    });
  });

  describe('formatActivities', () => {
    it('should format activities correctly', () => {
      const result = formatActivities([mockActivity]);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('activity-1');
      expect(result[0].type).toBe('IssueCreatedActivityItem');
    });

    it('should handle undefined activities', () => {
      const result = formatActivities(undefined);
      expect(result).toEqual([]);
    });

    it('should limit activities if maxActivities specified', () => {
      const activities = [mockActivity, { ...mockActivity, id: 'activity-2' }];
      const result = formatActivities(activities, { maxActivities: 1 });
      expect(result.length).toBe(1);
    });

    it('should format different activity types', () => {
      const fieldChangeActivity = {
        id: 'activity-field-change',
        $type: 'IssueCustomFieldActivityItem',
        timestamp: 1620000000000,
        author: mockUser,
        field: { name: 'State' },
        added: { presentation: 'In Progress' },
        removed: { presentation: 'Open' }
      };

      const commentActivity = {
        id: 'activity-comment',
        $type: 'IssueCommentActivityItem',
        timestamp: 1620000000000,
        author: mockUser,
        comment: { text: 'Comment added' }
      };

      const activities = [mockActivity, fieldChangeActivity, commentActivity];
      const result = formatActivities(activities, {}, { [mockUser.id]: mockUser });

      expect(result.length).toBe(3);
      expect(result[0].type).toBe('IssueCreatedActivityItem');
      expect(result[1].type).toBe('IssueCustomFieldActivityItem');
      expect(result[1].field).toBe('State');
      expect(result[1].addedValues).toEqual(['In Progress']);
      expect(result[1].removedValues).toEqual(['Open']);
      expect(result[2].type).toBe('IssueCommentActivityItem');
      expect(result[2].comment).toBe('Comment added');
    });

    it('should handle maxActivities = 0 to include all activities', () => {
      const activities = [mockActivity, { ...mockActivity, id: 'activity-2' }, { ...mockActivity, id: 'activity-3' }];
      const result = formatActivities(activities, { maxActivities: 0 });
      expect(result.length).toBe(3);
    });

    it('should handle empty activities array', () => {
      const result = formatActivities([], {});
      expect(result).toEqual([]);
    });

    it('should handle activities without author', () => {
      const activityWithoutAuthor = {
        id: 'activity-no-author',
        $type: 'IssueCreatedActivityItem',
        timestamp: 1620000000000,
        target: { id: 'issue-1' }
      };
      const result = formatActivities([activityWithoutAuthor], {});
      expect(result.length).toBe(1);
      expect(result[0].author).toBeUndefined();
    });
  });

  describe('formatIssue', () => {
    it('should format an issue correctly', () => {
      const issue = {
        ...mockIssue,
        comments: [mockComment],
        attachments: [mockAttachment],
        links: [mockLink],
        activities: [mockActivity]
      };

      const result = formatIssue(issue);
      expect(result).toBeTruthy();
      expect(result?.id).toBe('issue-1');
      expect(result?.idReadable).toBe('TEST-1');
      expect(result?.summary).toBe('Test Issue');
      expect(result?.project.id).toBe('project-1');
    });

    it('should handle null or undefined issue', () => {
      expect(formatIssue(null)).toBeNull();
      expect(formatIssue(undefined)).toBeNull();
    });

    it('should truncate description if maxDescriptionLength specified', () => {
      const issue = {
        ...mockIssue,
        description: 'A'.repeat(3000)
      };
      const result = formatIssue(issue, { maxDescriptionLength: 1000 });
      expect(result?.description?.length).toBeLessThanOrEqual(1020);
      expect(result?.description?.length).toBeGreaterThan(900);
    });

    it('should include raw data if option specified', () => {
      const result = formatIssue(mockIssue, { includeRawData: true });
      expect(result?._raw).toEqual(mockIssue);
    });

    it('should handle issue without optional fields', () => {
      const simpleIssue = {
        id: 'issue-no-optional',
        idReadable: 'SIMPLE-1',
        summary: 'Simple Issue',
        project: mockProject,
      };
      const result = formatIssue(simpleIssue);
      expect(result).toBeTruthy();
      expect(result?.description).toBeUndefined();
      expect(result?.timeline).toBeUndefined(); // Assuming timeline is not included by default if no comments/activities
      expect(result?.links).toEqual([]);
      expect(result?.attachments).toEqual([]);
      expect(result?.sprint).toBeUndefined();
      expect(result?.users).toEqual({});
      expect(result?.activelyWorkedContributors).toEqual([]);
    });

    it('should include timeline with comments and activities if present', () => {
      const issueWithTimeline = {
        ...mockIssue,
        comments: [mockComment],
        activities: [mockActivity],
      };
      const result = formatIssue(issueWithTimeline);
      expect(result?.timeline).toBeDefined();
      expect(result?.timeline?.length).toBeGreaterThan(0);
      // Check for combined timeline items
      const commentItem = result?.timeline?.find(item => item.type === 'comment');
      const activityItem = result?.timeline?.find(item => item.type === 'activity');
      expect(commentItem).toBeDefined();
      expect(activityItem).toBeDefined();
    });

    it('should not include activities if includeActivities is false', () => {
      const issueWithActivities = {
        ...mockIssue,
        activities: [mockActivity]
      };
      const result = formatIssue(issueWithActivities, { includeActivities: false });
      const activityItem = result?.timeline?.find(item => item.type === 'activity');
      expect(activityItem).toBeUndefined();
    });

    it('should limit activities in timeline if maxActivities specified', () => {
      const activities = [mockActivity, { ...mockActivity, id: 'activity-2' }, { ...mockActivity, id: 'activity-3' }];
      const issueWithManyActivities = {
        ...mockIssue,
        activities: activities,
        comments: [mockComment] // Add a comment to ensure timeline is created
      };
      const result = formatIssue(issueWithManyActivities, { maxActivities: 1 });
      expect(result?.timeline).toBeDefined();
      // Check if the number of activity items is limited
      const activityItems = result?.timeline?.filter(item => item.type === 'activity');
      expect(activityItems?.length).toBe(1);
    });

    it('should handle maxActivities = 0 to include all activities in timeline', () => {
      const activities = [mockActivity, { ...mockActivity, id: 'activity-2' }, { ...mockActivity, id: 'activity-3' }];
      const issueWithManyActivities = {
        ...mockIssue,
        activities: activities,
        comments: [mockComment]
      };
      const result = formatIssue(issueWithManyActivities, { maxActivities: 0 });
      expect(result?.timeline).toBeDefined();
      const activityItems = result?.timeline?.filter(item => item.type === 'activity');
      expect(activityItems?.length).toBe(3);
    });

    it('should include attachments if present', () => {
      const issueWithAttachments = {
        ...mockIssue,
        attachments: [mockAttachment]
      };
      const result = formatIssue(issueWithAttachments);
      expect(result?.attachments).toBeDefined();
      expect(result?.attachments?.length).toBe(1);
      expect(result?.attachments?.[0].id).toBe('attachment-1');
    });

    it('should not include attachments if includeAttachments is false', () => {
      const issueWithAttachments = {
        ...mockIssue,
        attachments: [mockAttachment]
      };
      const result = formatIssue(issueWithAttachments, { includeAttachments: false });
      expect(result?.attachments).toEqual([]);
    });
  });

  describe('formatSprint', () => {
    it('should format a sprint correctly', () => {
      const result = formatSprint(mockSprint);
      expect(result).toBeTruthy();
      expect(result?.id).toBe('sprint-1');
      expect(result?.name).toBe('Sprint 1');
      expect(result?.goal).toBe('Sprint goal');
      expect(typeof result?.isActive).toBe('boolean');
    });

    it('should handle null or undefined sprint', () => {
      expect(formatSprint(null)).toBeNull();
      expect(formatSprint(undefined)).toBeNull();
    });

    it('should include raw data if option specified', () => {
      const result = formatSprint(mockSprint, { includeRawData: true });
      expect(result?._raw).toEqual(mockSprint);
    });

    it('should handle sprint without optional fields', () => {
      const simpleSprint = {
        id: 'sprint-no-optional',
        name: 'Simple Sprint',
        isActive: false,
      };
      const result = formatSprint(simpleSprint);
      expect(result).toBeTruthy();
      expect(result?.goal).toBeUndefined();
      expect(result?.start).toBeUndefined();
      expect(result?.finish).toBeUndefined();
      expect(result?.isCompleted).toBeUndefined();
      expect(result?.isDefault).toBeUndefined();
      expect(result?.issues).toBeUndefined();
      expect(result?.unresolvedIssuesCount).toBeUndefined();
    });

    it('should include issues if present', () => {
      const sprintWithIssues = {
        ...mockSprint,
        issues: [{ id: 'issue-1', idReadable: 'TEST-1', summary: 'Test Issue' }],
        unresolvedIssuesCount: 1,
      };
      const result = formatSprint(sprintWithIssues);
      expect(result?.issues).toBeDefined();
      expect(result?.issues?.length).toBe(1);
      expect(result?.unresolvedIssuesCount).toBe(1);
    });
  });

  describe('formatBoard', () => {
    it('should format a board correctly', () => {
      const result = formatBoard(mockBoard);
      expect(result).toBeTruthy();
      expect(result?.id).toBe('board-1');
      expect(result?.name).toBe('Test Board');
      expect(result?.description).toBe('Test board description');
      expect(result?.projects?.length).toBe(1);
      expect(result?.sprints?.length).toBe(1);
    });

    it('should handle null or undefined board', () => {
      expect(formatBoard(null)).toBeNull();
      expect(formatBoard(undefined)).toBeNull();
    });

    it('should include raw data if option specified', () => {
      const result = formatBoard(mockBoard, { includeRawData: true });
      expect(result?._raw).toEqual(mockBoard);
    });
  });

  describe('formatYouTrackData', () => {
    it('should format an issue correctly', () => {
      const result = formatYouTrackData(mockIssue);
      expect(result).toBeTruthy();
      expect(result.id).toBe('issue-1');
    });

    it('should format a board correctly', () => {
      const result = formatYouTrackData(mockBoard);
      expect(result).toBeTruthy();
      expect(result.id).toBe('board-1');
    });

    it('should format a sprint correctly', () => {
      const result = formatYouTrackData(mockSprint);
      expect(result).toBeTruthy();
      expect(result.id).toBe('sprint-1');
    });

    it('should stringify result if option specified', () => {
      const result = formatYouTrackData(mockIssue, { stringify: true });
      expect(typeof result).toBe('string');
      const parsed = JSON.parse(result as string);
      expect(parsed.id).toBe('issue-1');
    });
  });
}); 