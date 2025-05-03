import * as YouTrackTypes from '../../src/types/youtrack';

/**
 * Anonymization options for converting real data to sample data
 */
export interface AnonymizerOptions {
  /** Preserve IDs from original data to maintain referential integrity */
  preserveIds?: boolean;
  /** Seed text to use for deterministic anonymization */
  seed?: string;
  /** Replace email domains with this domain */
  emailDomain?: string;
}

const DEFAULT_OPTIONS: AnonymizerOptions = {
  preserveIds: false,
  seed: 'sample',
  emailDomain: 'example.com'
};

/**
 * Generate a sample string with a prefix and deterministic suffix
 */
function generateSampleString(prefix: string, original: string, seed: string): string {
  const hashCode = (s: string) => {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = ((hash << 5) - hash) + s.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };
  
  const hash = hashCode(original + seed);
  return `${prefix}-${hash.toString(16).substring(0, 4)}`;
}

/**
 * Replace user information with sample data
 */
export function anonymizeUser(user: YouTrackTypes.User, options: AnonymizerOptions = {}): YouTrackTypes.User {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (!user) return user;
  
  const id = opts.preserveIds ? user.id : generateSampleString('user', user.id, opts.seed || '');
  const name = generateSampleString('User', user.name, opts.seed || '');
  
  // Create email from name by removing spaces and adding domain
  const emailName = name.replace(/[^a-zA-Z0-9]/g, '.').toLowerCase();
  const email = user.email ? `${emailName}@${opts.emailDomain}` : undefined;
  
  return {
    ...user,
    id,
    name,
    fullName: `${name} ${generateSampleString('Surname', user.id, opts.seed || '')}`,
    login: emailName,
    email,
    avatarUrl: user.avatarUrl ? 'https://example.com/avatar.png' : undefined,
    ringId: opts.preserveIds ? user.ringId : undefined,
    $type: user.$type
  };
}

/**
 * Replace project information with sample data
 */
export function anonymizeProject(project: YouTrackTypes.Project, options: AnonymizerOptions = {}): YouTrackTypes.Project {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (!project) return project;
  
  const id = opts.preserveIds ? project.id : generateSampleString('project', project.id, opts.seed || '');
  const name = generateSampleString('Project', project.name, opts.seed || '');
  
  return {
    ...project,
    id,
    name,
    shortName: name.substring(0, 4).toUpperCase(),
    description: project.description ? `Sample project description for ${name}` : undefined,
    leader: project.leader ? anonymizeUser(project.leader, opts) : undefined,
    $type: project.$type
  };
}

/**
 * Replace issue information with sample data
 */
export function anonymizeIssue(issue: YouTrackTypes.Issue, options: AnonymizerOptions = {}): YouTrackTypes.Issue {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (!issue) return issue;
  
  const id = opts.preserveIds ? issue.id : generateSampleString('issue', issue.id, opts.seed || '');
  const projectPrefix = issue.project ? 
    (issue.project.shortName || 'SAMPLE') : 
    'SAMPLE';
  
  const idReadable = `${projectPrefix}-${Math.floor(Math.random() * 9000) + 1000}`;
  const summary = `Sample issue: ${generateSampleString('', issue.summary, opts.seed || '')}`;
  
  // Base issue with anonymized fields
  const anonymizedIssue: YouTrackTypes.Issue = {
    ...issue,
    id,
    idReadable,
    numberInProject: parseInt(idReadable.split('-')[1]) || Math.floor(Math.random() * 9000) + 1000,
    summary,
    description: issue.description ? 
      `Sample description for issue ${idReadable}.\n\nThis is anonymized content that preserves the structure of the original description.` : 
      undefined,
    reporter: issue.reporter ? anonymizeUser(issue.reporter, opts) : undefined,
    updater: issue.updater ? anonymizeUser(issue.updater, opts) : undefined,
    project: issue.project ? anonymizeProject(issue.project, opts) : undefined,
    $type: issue.$type
  };

  // Comments are now only accessed through activities, so we don't need to handle issue.comments
  
  // Handle custom fields if present
  if (issue.customFields && issue.customFields.length > 0) {
    anonymizedIssue.customFields = issue.customFields.map(field => anonymizeCustomField(field, opts));
  }
  
  return anonymizedIssue;
}

/**
 * Replace issue with activities with sample data
 */
export function anonymizeIssueWithActivities(
  issue: YouTrackTypes.IssueWithActivities, 
  options: AnonymizerOptions = {}
): YouTrackTypes.IssueWithActivities {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // First anonymize the base issue
  const anonymizedIssue = anonymizeIssue(issue, opts) as YouTrackTypes.IssueWithActivities;
  
  // Handle activities if present
  if (issue.activities && issue.activities.length > 0) {
    anonymizedIssue.activities = issue.activities.map(activity => anonymizeActivity(activity, opts));
  }
  
  return anonymizedIssue;
}

/**
 * Replace comment information with sample data
 */
function anonymizeComment(comment: YouTrackTypes.IssueComment, options: AnonymizerOptions = {}): YouTrackTypes.IssueComment {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (!comment) return comment;
  
  const id = opts.preserveIds ? comment.id : generateSampleString('comment', comment.id, opts.seed || '');
  
  return {
    ...comment,
    id,
    text: comment.text ? `Sample comment text. This replaces the original comment content.` : null,
    author: comment.author ? anonymizeUser(comment.author, opts) : undefined,
    $type: comment.$type
  };
}

/**
 * Replace activity information with sample data
 */
function anonymizeActivity(activity: YouTrackTypes.ActivityItem, options: AnonymizerOptions = {}): YouTrackTypes.ActivityItem {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (!activity) return activity;
  
  const id = opts.preserveIds ? activity.id : generateSampleString('activity', activity.id, opts.seed || '');
  
  const anonymizedActivity: YouTrackTypes.ActivityItem = {
    ...activity,
    id,
    author: anonymizeUser(activity.author, opts),
    timestamp: activity.timestamp,
    $type: activity.$type
  };
  
  // Handle target if present
  if (activity.target) {
    anonymizedActivity.target = {
      ...activity.target,
      id: opts.preserveIds ? activity.target.id : generateSampleString('target', activity.target.id, opts.seed || ''),
      idReadable: activity.target.idReadable ? `SAMPLE-${Math.floor(Math.random() * 9000) + 1000}` : undefined,
      text: activity.target.text ? 'Sample target text' : undefined,
      $type: activity.target.$type
    };
  }
  
  // Handle added items if present
  if (activity.added) {
    // Handle both array and non-array cases
    if (Array.isArray(activity.added) && activity.added.length > 0) {
      anonymizedActivity.added = activity.added.map(item => ({
        ...item,
        id: opts.preserveIds ? item.id : generateSampleString('added', item.id, opts.seed || ''),
        name: item.name ? `Sample ${item.name}` : undefined,
        presentation: item.presentation ? `Sample ${item.presentation}` : undefined,
        text: item.text ? 'Sample added text' : undefined,
        author: item.author ? anonymizeUser(item.author, opts) : undefined
      }));
    } else if (!Array.isArray(activity.added)) {
      // Handle single object case
      const item = activity.added;
      anonymizedActivity.added = {
        ...item,
        id: opts.preserveIds ? item.id : generateSampleString('added', item.id, opts.seed || ''),
        name: item.name ? `Sample ${item.name}` : undefined,
        presentation: item.presentation ? `Sample ${item.presentation}` : undefined,
        text: item.text ? 'Sample added text' : undefined,
        author: item.author ? anonymizeUser(item.author, opts) : undefined
      };
    }
  }
  
  // Handle removed items if present
  if (activity.removed) {
    // Handle both array and non-array cases
    if (Array.isArray(activity.removed) && activity.removed.length > 0) {
      anonymizedActivity.removed = activity.removed.map(item => ({
        ...item,
        id: opts.preserveIds ? item.id : generateSampleString('removed', item.id, opts.seed || ''),
        name: item.name ? `Sample ${item.name}` : undefined,
        presentation: item.presentation ? `Sample ${item.presentation}` : undefined,
        text: item.text ? 'Sample removed text' : undefined,
        author: item.author ? anonymizeUser(item.author, opts) : undefined
      }));
    } else if (!Array.isArray(activity.removed)) {
      // Handle single object case
      const item = activity.removed;
      anonymizedActivity.removed = {
        ...item,
        id: opts.preserveIds ? item.id : generateSampleString('removed', item.id, opts.seed || ''),
        name: item.name ? `Sample ${item.name}` : undefined,
        presentation: item.presentation ? `Sample ${item.presentation}` : undefined,
        text: item.text ? 'Sample removed text' : undefined,
        author: item.author ? anonymizeUser(item.author, opts) : undefined
      };
    }
  }
  
  return anonymizedActivity;
}

/**
 * Replace custom field information with sample data
 */
function anonymizeCustomField(field: YouTrackTypes.AnyIssueCustomField, options: AnonymizerOptions = {}): YouTrackTypes.AnyIssueCustomField {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (!field) return field;
  
  const id = opts.preserveIds ? field.id : generateSampleString('field', field.id, opts.seed || '');
  
  const baseField = {
    ...field,
    id,
    name: field.name
  };
  
  // Handle different field types
  switch (field.$type) {
    case 'SingleUserIssueCustomField':
      return {
        ...baseField,
        value: field.value ? anonymizeUser(field.value, opts) : null,
        $type: field.$type
      } as YouTrackTypes.SingleUserIssueCustomField;
      
    case 'MultiUserIssueCustomField':
      return {
        ...baseField,
        value: field.value ? field.value.map(user => anonymizeUser(user, opts)) : [],
        $type: field.$type
      } as YouTrackTypes.MultiUserIssueCustomField;
      
    case 'SingleEnumIssueCustomField':
    case 'StateIssueCustomField':
      // Preserve enum values as they're usually not sensitive
      return baseField;
      
    case 'SimpleIssueCustomField':
      // For simple fields like text fields, replace content if it's a string
      if (typeof field.value === 'string' && field.value.length > 20) {
        return {
          ...baseField,
          value: `Sample ${field.name} value`,
          $type: field.$type
        } as YouTrackTypes.SimpleIssueCustomField;
      }
      return baseField;
      
    default:
      return baseField;
  }
}

/**
 * Replace board information with sample data
 */
export function anonymizeBoard(board: YouTrackTypes.Board, options: AnonymizerOptions = {}): YouTrackTypes.Board {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (!board) return board;
  
  const id = opts.preserveIds ? board.id : generateSampleString('board', board.id, opts.seed || '');
  const name = `Sample Board: ${generateSampleString('', board.name, opts.seed || '')}`;
  
  const anonymizedBoard: YouTrackTypes.Board = {
    ...board,
    id,
    name,
    description: board.description ? `Sample board description for ${name}` : undefined,
    owner: board.owner ? anonymizeUser(board.owner, opts) : undefined,
    $type: board.$type
  };
  
  // Handle projects if present
  if (board.projects && board.projects.length > 0) {
    anonymizedBoard.projects = board.projects.map(project => anonymizeProject(project, opts));
  }
  
  // Handle sprints if present
  if (board.sprints && board.sprints.length > 0) {
    anonymizedBoard.sprints = board.sprints.map(sprint => anonymizeSprint(sprint, opts));
  }
  
  // Handle current sprint if present
  if (board.currentSprint) {
    anonymizedBoard.currentSprint = anonymizeSprint(board.currentSprint, opts);
  }
  
  return anonymizedBoard;
}

/**
 * Replace sprint information with sample data
 */
export function anonymizeSprint(sprint: YouTrackTypes.Sprint, options: AnonymizerOptions = {}): YouTrackTypes.Sprint {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (!sprint) return sprint;
  
  const id = opts.preserveIds ? sprint.id : generateSampleString('sprint', sprint.id, opts.seed || '');
  const sprintNumber = Math.floor(Math.random() * 20) + 1;
  const name = `Sprint ${sprintNumber}`;
  
  const anonymizedSprint: YouTrackTypes.Sprint = {
    ...sprint,
    id,
    name,
    goal: sprint.goal ? `Sample sprint goal for ${name}` : null,
    $type: sprint.$type
  };
  
  // Preserve dates to maintain timeline integrity
  if (sprint.start) anonymizedSprint.start = sprint.start;
  if (sprint.finish) anonymizedSprint.finish = sprint.finish;
  
  // Anonymize issue references if present
  if (sprint.issues && sprint.issues.length > 0) {
    anonymizedSprint.issues = sprint.issues.map(issue => {
      const projectPrefix = 'SAMPLE';
      const idNumber = Math.floor(Math.random() * 9000) + 1000;
      
      return {
        ...issue,
        id: opts.preserveIds ? issue.id : generateSampleString('issue', issue.id, opts.seed || ''),
        idReadable: `${projectPrefix}-${idNumber}`,
        $type: issue.$type
      };
    });
  }
  
  return anonymizedSprint;
}

export default {
  anonymizeUser,
  anonymizeProject,
  anonymizeIssue,
  anonymizeIssueWithActivities,
  anonymizeBoard,
  anonymizeSprint
}; 