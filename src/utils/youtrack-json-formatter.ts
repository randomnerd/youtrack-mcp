import * as YouTrackTypes from '../types/youtrack';
import { formatDate, formatFileSize } from './issue-formatter';

/**
 * Configuration options for the JSON formatter
 */
export interface JsonFormatterOptions {
  /** Include raw data for certain fields (for debugging or advanced processing) */
  includeRawData?: boolean;
  /** Include activity history in the output */
  includeActivities?: boolean;
  /** Maximum number of activities to include (0 = all) */
  maxActivities?: number;
  /** Include attachments information */
  includeAttachments?: boolean;
  /** Maximum description length before truncation */
  maxDescriptionLength?: number;
  /** Maximum comment text length before truncation */
  maxCommentLength?: number;
  /** If true, return pretty-printed JSON string instead of object */
  stringify?: boolean;
}

/**
 * Default formatter options
 */
const DEFAULT_OPTIONS: JsonFormatterOptions = {
  includeRawData: false,
  includeActivities: true,
  maxActivities: 40,
  includeAttachments: true,
  maxDescriptionLength: 2000,
  maxCommentLength: 1000
};

/**
 * Simplified User object
 */
export interface SimpleUser {
  id: string;
  name: string;
  fullName?: string;
  login?: string;
  email?: string;
  avatarUrl?: string;
}

/**
 * Simplified Project object
 */
export interface SimpleProject {
  id: string;
  name: string;
  shortName?: string;
}

/**
 * Simplified CustomField object
 */
export interface SimpleCustomField {
  name: string;
  value: string | string[] | number | boolean | null;
  valueId?: string;
  color?: string;
  isResolved?: boolean;
}

/**
 * Timeline item type enum
 */
export enum TimelineItemType {
  COMMENT = 'comment',
  ACTIVITY = 'activity'
}

/**
 * Simplified Timeline Item (representing either a comment or an activity)
 */
export interface SimpleTimelineItem {
  id: string;
  type: TimelineItemType;
  timestamp: string;
  author: string; // User ID reference
  // Fields for comments
  text?: string;
  isPinned?: boolean;
  // Fields for activities
  activityType?: string;
  field?: string;
  addedValues?: string[];
  removedValues?: string[];
}

/**
 * Simplified Comment object
 */
export interface SimpleComment {
  id: string;
  text: string;
  created: string;
  author: string;
  isPinned?: boolean;
}

/**
 * Simplified Attachment object
 */
export interface SimpleAttachment {
  id: string;
  name: string;
  url?: string;
  mimeType?: string;
  size?: string;
  created?: string;
  author?: string;
}

/**
 * Simplified Link object
 */
export interface SimpleLink {
  type: string;
  direction: string;
  issues: SimpleLinkedIssue[];
}

/**
 * Simplified LinkedIssue object
 */
export interface SimpleLinkedIssue {
  id: string;
  idReadable: string;
  summary?: string;
  resolved?: boolean;
}

/**
 * Simplified Activity object
 */
export interface SimpleActivity {
  id: string;
  type: string;
  timestamp: string;
  author: string;
  field?: string;
  addedValues?: string[];
  removedValues?: string[];
  comment?: string;
}

/**
 * Contributor who was assignee at a key state transition
 */
export interface ActivelyWorkedContributor {
  userId: string;
  name: string;
  state: string;
}

/**
 * Simplified Issue object
 */
export interface SimpleIssue {
  id: string;
  idReadable: string;
  summary: string;
  description?: string;
  project: SimpleProject;
  created?: string;
  updated?: string;
  resolved?: string | null;
  reporter?: string; // Changed to user ID reference
  timeline?: SimpleTimelineItem[]; // Combined timeline of comments and activities
  links?: SimpleLink[];
  attachments?: SimpleAttachment[];
  sprint?: string;
  users?: Record<string, SimpleUser>; // Added collection of unique users
  activelyWorkedContributors?: ActivelyWorkedContributor[];
  _raw?: any;
  // Custom fields will be added dynamically to the root
  [key: string]: any;
}

/**
 * Simplified Sprint object
 */
export interface SimpleSprint {
  id: string;
  name: string;
  goal?: string;
  start?: string;
  finish?: string;
  isActive: boolean;
  isCompleted?: boolean;
  isDefault?: boolean;
  issues?: SimpleLinkedIssue[];
  unresolvedIssuesCount?: number;
  _raw?: any;
}

/**
 * Simplified Board object
 */
export interface SimpleBoard {
  id: string;
  name: string;
  description?: string;
  projects?: SimpleProject[];
  sprints?: SimpleSprint[];
  currentSprint?: SimpleSprint;
  owner?: string;
  users?: Record<string, SimpleUser>;
  _raw?: any;
}

/**
 * Converts formatted YouTrack data to a Markdown document
 * @param data - The formatted data object
 * @returns Markdown string
 */
function toMarkdown(data: any): string {
  if (data == null) return 'No data.';

  // Helper for code blocks
  const code = (str: string) => `\n\n\`\`\`\n${str}\n\`\`\`\n`;

  // Helper for tables
  function table(headers: string[], rows: string[][]): string {
    const headerRow = `| ${headers.join(' | ')} |`;
    const sepRow = `|${headers.map(() => '---').join('|')}|`;
    const bodyRows = rows.map(r => `| ${r.join(' | ')} |`).join('\n');
    return `${headerRow}\n${sepRow}\n${bodyRows}`;
  }

  // Issue
  if (data.idReadable && data.summary) {
    let md = `# Issue: ${data.idReadable} - ${data.summary}\n`;
    if (data.description) md += `\n**Description:**\n${data.description}\n`;
    md += `\n**Project:** ${data.project?.name || ''}`;
    if (data.created) md += `\n**Created:** ${data.created}`;
    if (data.updated) md += `\n**Updated:** ${data.updated}`;
    if (data.resolved) md += `\n**Resolved:** ${data.resolved}`;
    if (data.reporter) md += `\n**Reporter:** ${data.users?.[data.reporter]?.name || data.reporter}`;
    // Custom fields in header
    const skip = new Set(['id', 'idReadable', 'summary', 'description', 'project', 'created', 'updated', 'resolved', 'reporter', 'timeline', 'links', 'attachments', 'sprint', 'users', '_raw', 'activelyWorkedContributors']);
    const customFields = Object.entries(data).filter(([k, v]) => !skip.has(k) && v !== undefined && v !== null);
    if (customFields.length) {
      for (const [k, v] of customFields) {
        md += `\n**${k}:** ${Array.isArray(v) ? v.join(', ') : String(v)}`;
      }
    }
    // Actively worked contributors table
    if (Array.isArray(data.activelyWorkedContributors) && data.activelyWorkedContributors.length > 0) {
      md += '\n\n### Actively Worked Contributors\n';
      md += table(
        ['Name', 'State'],
        data.activelyWorkedContributors.map((c: any) => [c.name || c.userId, c.state])
      );
    }
    // Timeline
    if (data.timeline && data.timeline.length) {
      md += '\n\n## Timeline';
      for (const item of data.timeline) {
        if (item.type === 'comment') {
          md += `\n- **[Comment]** ${item.author ? (data.users?.[item.author]?.name || item.author) : ''} at ${item.timestamp}:\n  > ${item.text}`;
        } else if (item.type === 'activity') {
          md += `\n- **[Activity]** ${item.author ? (data.users?.[item.author]?.name || item.author) : ''} at ${item.timestamp}: ${item.activityType || ''}`;
          if (item.field) md += ` field: ${item.field}`;
          if (item.addedValues) md += ` added: ${item.addedValues.join(', ')}`;
          if (item.removedValues) md += ` removed: ${item.removedValues.join(', ')}`;
        }
      }
    }
    // Links
    if (data.links && data.links.length) {
      md += '\n\n## Links\n';
      for (const link of data.links) {
        md += `- **${link.type}** (${link.direction}): `;
        md += link.issues.map((iss: any) => `${iss.idReadable} (${iss.summary || ''})`).join(', ') + '\n';
      }
    }
    // Attachments
    if (data.attachments && data.attachments.length) {
      md += '\n\n## Attachments\n';
      md += table(
        ['Name', 'Size', 'Author', 'Created'],
        data.attachments.map((a: any) => [a.name, a.size || '', data.users?.[a.author]?.name || a.author || '', a.created || ''])
      );
    }
    // Sprint
    if (data.sprint) md += `\n\n**Sprint:** ${data.sprint}`;
    return md.trim();
  }

  // Sprint
  if (data.name && ('isActive' in data || 'unresolvedIssuesCount' in data)) {
    let md = `# Sprint: ${data.name} (${data.id})\n`;
    if (data.goal) md += `\n**Goal:** ${data.goal}`;
    if (data.start) md += `\n**Start:** ${data.start}`;
    if (data.finish) md += `\n**Finish:** ${data.finish}`;
    md += `\n**Active:** ${data.isActive ? 'Yes' : 'No'}`;
    if ('isCompleted' in data) md += `\n**Completed:** ${data.isCompleted ? 'Yes' : 'No'}`;
    if ('isDefault' in data) md += `\n**Default:** ${data.isDefault ? 'Yes' : 'No'}`;
    if ('unresolvedIssuesCount' in data) md += `\n**Unresolved Issues:** ${data.unresolvedIssuesCount}`;
    if (data.issues && data.issues.length) {
      md += '\n\n## Issues\n';
      md += table(['ID', 'Summary', 'Resolved'], data.issues.map((i: any) => [i.idReadable, i.summary || '', i.resolved ? 'Yes' : 'No']));
    }
    return md.trim();
  }

  // Board
  if (data.name && data.sprints) {
    let md = `# Board: ${data.name}\n`;
    if (data.description) md += `\n**Description:** ${data.description}`;
    if (data.owner) md += `\n**Owner:** ${data.users?.[data.owner]?.name || data.owner}`;
    if (data.projects && data.projects.length) {
      md += '\n\n## Projects\n';
      md += data.projects.map((p: any) => `- ${p.name} (${p.shortName || p.id})`).join('\n');
    }
    if (data.sprints && data.sprints.length) {
      md += '\n\n## Sprints\n';
      md += data.sprints.map((s: any) => {
        let sprintLine = `### Sprint: ${s.name} (${s.id}) (${s.isActive ? 'Active' : s.isCompleted ? 'Completed' : 'Inactive'}) ${s.start} - ${s.finish}`;
        if (s.issues && s.issues.length) {
          sprintLine += '\n' + s.issues.map((iss: any) => `  - ${iss.idReadable} (${iss.id}) ${iss.created}`).join('\n');
        }
        return sprintLine;
      }).join('\n');
    }
    if (data.currentSprint) {
      md += `\n\n**Current Sprint:** ${data.currentSprint.name}`;
    }
    return md.trim();
  }

  // Project
  if (data.name && data.shortName) {
    let md = `# Project: ${data.name}\n`;
    md += `\n**Short Name:** ${data.shortName}`;
    if (data.id) md += `\n**ID:** ${data.id}`;
    return md.trim();
  }

  // Comment
  if (data.text && data.author && data.created) {
    let md = `# Comment\n`;
    md += `**Author:** ${data.author}\n`;
    md += `**Created:** ${data.created}\n`;
    md += `\n${data.text}`;
    return md.trim();
  }

  // ActivityContainer
  if (data.activities && Array.isArray(data.activities)) {
    let md = `# Activities\n`;
    for (const act of data.activities) {
      md += `- **${act.type}** by ${act.author} at ${act.timestamp}`;
      if (act.field) md += ` field: ${act.field}`;
      if (act.addedValues) md += ` added: ${act.addedValues.join(', ')}`;
      if (act.removedValues) md += ` removed: ${act.removedValues.join(', ')}`;
      if (act.comment) md += `\n  > ${act.comment}`;
      md += '\n';
    }
    return md.trim();
  }

  // Array of entities
  if (Array.isArray(data)) {
    return data.map(toMarkdown).join('\n\n---\n\n');
  }

  // Unknown
  return `# Unknown Entity\n${code(typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data))}`;
}

/**
 * Entry point for formatting YouTrack API responses to simpler objects
 * @param data - YouTrack API response data
 * @param options - Formatting options
 * @returns Simplified data object or Markdown string if stringify is true
 */
export function formatYouTrackData(data: any, options: JsonFormatterOptions = {}): any {
  if (!data) {
    return options.stringify ? 'No data.' : null;
  }
  
  // Merge default options with provided options
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Handle array of items
  if (Array.isArray(data)) {
    const arr = data.map(item => formatYouTrackData(item));
    return opts.stringify ? toMarkdown(arr) : arr;
  }
  
  // Determine entity type using a helper function
  const entityType = detectEntityType(data);
  
  // Format based on detected entity type
  let result: any;
  switch (entityType) {
    case 'Issue':
      result = formatIssue(data, opts);
      break;
    case 'Sprint':
      result = formatSprint(data, opts);
      break;
    case 'Board':
      result = formatBoard(data, opts);
      break;
    case 'Project':
      result = formatProject(data, opts);
      break;
    case 'Comment':
      result = formatComment(data, opts);
      break;
    case 'ActivityContainer':
      result = {
        activities: formatActivities(data.activities, opts),
        _raw: opts.includeRawData ? data : undefined
      };
      break;
    default:
      // For unrecognized data, just return it as is
      result = data;
  }
  return opts.stringify ? toMarkdown(result) : result;
}

/**
 * Detects the entity type from data
 */
function detectEntityType(data: any): string {
  if (data === null || data === undefined || typeof data !== 'object') {
    return 'Unknown';
  }
  
  // If there's an explicit type field, use it
  if (data.$type) {
    return data.$type;
  }
  
  // If no explicit type or unrecognized type, infer from properties
  if ('idReadable' in data && 'summary' in data) {
    return 'Issue';
  } 
  
  if ('name' in data && 'projects' in data) {
    return 'AgileBoard';
  }
  
  if ('name' in data && 'start' in data && 'finish' in data) {
    return 'Sprint';
  }
  
  if ('shortName' in data && 'name' in data) {
    return 'Project';
  }
  
  return 'Unknown';
}

/**
 * Format a YouTrack User object to a simpler representation
 * @param user - YouTrack User object
 * @returns Simplified User object
 */
export function formatUser(user: any): SimpleUser | undefined {
  if (!user) {
    return undefined;
  }
  
  return {
    id: user.id,
    name: user.name,
    fullName: user.fullName,
    login: user.login,
    email: user.email,
    avatarUrl: user.avatarUrl
  };
}

/**
 * Format a YouTrack Project object to a simpler representation
 * @param project - YouTrack Project object
 * @returns Simplified Project object
 */
export function formatProject(project: any, options: JsonFormatterOptions = {}): SimpleProject | undefined {
  if (!project) {
    return undefined;
  }
  
  const simpleProject: SimpleProject & { _raw?: any } = {
    id: project.id,
    name: project.name,
    shortName: project.shortName
  };
  
  if (options.includeRawData) {
    simpleProject._raw = project;
  }
  
  return simpleProject;
}

/**
 * Format custom fields to simpler representation
 * @param customFields - Array of YouTrack custom fields
 * @returns Array of simplified custom fields
 */
export function formatCustomFields(customFields: any[] | undefined): SimpleCustomField[] {
  if (!customFields || customFields.length === 0) {
    return [];
  }
  
  return customFields.map(field => {
    const formattedField: SimpleCustomField = {
      name: field.name,
      value: null
    };
    
    // Use type property to determine how to format the field
    // Handle different field types based on their $type property
    switch (field.$type) {
      case 'SingleEnumIssueCustomField': {
        // Skip this block if no value
        if (!field.value) break;
          
        // Set the basic value properties
        formattedField.value = field.value.name;
        formattedField.valueId = field.value.id;
          
        // Set color if available
        formattedField.color = field.value.color?.background;
        break;
      }
        
      case 'MultiEnumIssueCustomField': {
        // Only process if value is an array
        if (field.value && Array.isArray(field.value)) {
          formattedField.value = field.value.map((v: any) => v.name);
        }
        break;
      }
        
      case 'StateIssueCustomField': {
        // Skip this block if no value
        if (!field.value) break;
        
        // Set the basic value properties
        formattedField.value = field.value.name;
        formattedField.valueId = field.value.id;
        formattedField.isResolved = field.value.isResolved;
          
        // Set color if available
        formattedField.color = field.value.color?.background;
        break;
      }
        
      case 'SingleUserIssueCustomField': {
        // Skip this block if no value
        if (!field.value) break;
        
        formattedField.value = field.value.name;
        formattedField.valueId = field.value.id;
        break;
      }
        
      case 'MultiUserIssueCustomField': {
        // Only process if value is an array
        if (field.value && Array.isArray(field.value)) {
          formattedField.value = field.value.map((user: any) => user.name);
        }
        break;
      }
        
      case 'SimpleIssueCustomField': {
        // Directly assign the value (could be null/undefined)
        formattedField.value = field.value;
        break;
      }
        
      case 'PeriodIssueCustomField': {
        // Skip this block if no value
        if (!field.value) break;
        
        formattedField.value = field.value.$type === 'PeriodValue' 
          ? 'Period Value' 
          : String(field.value);
        formattedField.valueId = field.value.id;
        break;
      }
    }
    
    // Normalize any undefined values
    if (formattedField.value === undefined) {
      formattedField.value = null;
    }
    
    return formattedField;
  });
}

/**
 * Extract comment text and author from IssueCommentActivityItem
 */
export function extractCommentTextFromActivity(activity: any): string | undefined {
  try {
    const type = activity?.$type;
    if (type === 'IssueCommentActivityItem') {
      return activity?.added?.[0]?.text;
    }
    
    return undefined;
  } catch (err) {
    return undefined;
  }
}

/**
 * Format a comment object from YouTrack API
 */
export function formatComment(comment: any, options: JsonFormatterOptions = {}): SimpleComment | null {
  if (!comment) return null;
  
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  let text = comment.text || '';
  if (opts.maxCommentLength && text.length > opts.maxCommentLength) {
    text = text.substring(0, opts.maxCommentLength) + ' [truncated]';
  }
  
  return {
    id: comment.id,
    text,
    author: comment.author ? comment.author.id : undefined,
    created: comment.created ? formatDate(comment.created) : 'unknown date'
  };
}

/**
 * Format an array of comment objects from YouTrack API
 */
export function formatComments(
  comments: any[] = [], 
  options: JsonFormatterOptions = {},
  userMap: Record<string, SimpleUser> = {}
): SimpleComment[] {
  if (!comments || !Array.isArray(comments)) {
    return [];
  }
  
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return comments.map(comment => {
    if (!comment) return null;
    
    let text = comment.text || '';
    if (opts.maxCommentLength && text.length > opts.maxCommentLength) {
      text = text.substring(0, opts.maxCommentLength) + ' [truncated]';
    }
    
    // Format and store author in the user map
    const authorId = comment.author?.id || 'unknown';
    if (comment.author && authorId && !userMap[authorId]) {
      userMap[authorId] = formatUser(comment.author) || { id: 'unknown', name: 'Unknown User' };
    }
    
    return {
      id: comment.id,
      text,
      author: authorId,
      created: comment.created ? formatDate(comment.created) : 'unknown date',
      isPinned: comment.isPinned
    };
  }).filter(Boolean) as SimpleComment[];
}

/**
 * Format links to simpler representation
 * @param links - YouTrack link objects
 * @returns Simplified link objects
 */
export function formatLinks(links: any[] | undefined): SimpleLink[] {
  if (!links || links.length === 0) {
    return [];
  }
  
  return links.map(link => {
    const result: SimpleLink = {
      type: link.linkType?.name || 'Unknown',
      direction: link.direction || 'BOTH',
      issues: []
    };
    
    if (link.issues && link.issues.length > 0) {
      result.issues = link.issues.map((issue: any) => ({
        id: issue.id,
        idReadable: issue.idReadable,
        summary: issue.summary,
        resolved: !!issue.resolved
      }));
    } else if (link.trimmedIssues && link.trimmedIssues.length > 0) {
      result.issues = link.trimmedIssues.map((issue: any) => ({
        id: issue.id,
        idReadable: issue.idReadable,
        summary: issue.summary,
        resolved: !!issue.resolved
      }));
    }
    
    return result;
  });
}

/**
 * Format attachments to simpler representation
 * @param attachments - YouTrack attachment objects
 * @param userMap - Map to collect unique users
 * @returns Simplified attachment objects
 */
export function formatAttachments(
  attachments: any[] | undefined, 
  userMap: Record<string, SimpleUser> = {}
): SimpleAttachment[] {
  if (!attachments || attachments.length === 0) {
    return [];
  }
  
  return attachments.map(attachment => {
    // Format and store author in the user map
    const authorId = attachment.author?.id || undefined;
    if (attachment.author && authorId && !userMap[authorId]) {
      userMap[authorId] = formatUser(attachment.author) || { id: 'unknown', name: 'Unknown User' };
    }
    
    return {
      id: attachment.id,
      name: attachment.name,
      url: attachment.url,
      mimeType: attachment.mimeType,
      size: attachment.size ? formatFileSize(attachment.size) : undefined,
      created: attachment.created ? formatDate(attachment.created) : undefined,
      author: authorId
    };
  });
}

/**
 * Format activities to simpler representation
 * @param activities - YouTrack activity objects
 * @param options - Formatting options
 * @param userMap - Map to collect unique users
 * @returns Simplified activity objects
 */
export function formatActivities(
  activities: any[] | undefined, 
  options: JsonFormatterOptions = {}, 
  userMap: Record<string, SimpleUser> = {}
): SimpleActivity[] {
  if (!activities || !Array.isArray(activities)) {
    return [];
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Apply activities limit (maxActivities=0 means no limit)
  const limitedActivities = opts.maxActivities && opts.maxActivities > 0 
    ? activities.slice(0, opts.maxActivities) 
    : activities;

  return limitedActivities.map(activity => {
    if (!activity) return null;

    const type = activity.$type || 'Unknown';
    const author = activity.author ? activity.author.id : undefined;
    const timestamp = activity.timestamp 
      ? formatDate(activity.timestamp) 
      : 'unknown date';

    const result: SimpleActivity = {
      id: activity.id || `activity-${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp,
      author,
    };

    // Extract field information for different activity types
    if (type === 'IssueCustomFieldActivityItem' || type.includes('Field')) {
      if (activity.field && activity.field.name) {
        result.field = activity.field.name;
      }

      if (activity.added && (activity.added.presentation || activity.added.name)) {
        result.addedValues = [activity.added.presentation || activity.added.name];
      } else if (activity.added && activity.added.fields) {
        result.addedValues = activity.added.fields.map((f: any) => f.value || f.name).filter(Boolean);
      }

      if (activity.removed && (activity.removed.presentation || activity.removed.name)) {
        result.removedValues = [activity.removed.presentation || activity.removed.name];
      } else if (activity.removed && activity.removed.fields) {
        result.removedValues = activity.removed.fields.map((f: any) => f.value || f.name).filter(Boolean);
      }
    } else if (type === 'IssueCommentActivityItem' && activity.comment) {
      // Add comment text from comment activities
      result.comment = activity.comment.text;
    }

    return result;
  }).filter(Boolean) as SimpleActivity[];
}

/**
 * Format comments as timeline items
 * @param comments - YouTrack comment objects
 * @param options - Formatting options
 * @param userMap - Map to collect unique users
 * @returns Timeline items from comments
 */
export function formatCommentsAsTimelineItems(
  comments: any[] | undefined, 
  options: JsonFormatterOptions = {}, 
  userMap: Record<string, SimpleUser> = {}
): SimpleTimelineItem[] {
  if (!comments || comments.length === 0) {
    return [];
  }
  
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return comments.map(comment => {
    let text = comment.text || '';
    if (opts.maxCommentLength && text.length > opts.maxCommentLength) {
      text = text.substring(0, opts.maxCommentLength) + ' [truncated]';
    }
    
    // Format and store author in the user map
    const authorId = comment.author?.id || 'unknown';
    if (comment.author && !userMap[authorId]) {
      userMap[authorId] = formatUser(comment.author) || { id: 'unknown', name: 'Unknown User' };
    }
    
    return {
      id: comment.id,
      type: TimelineItemType.COMMENT,
      timestamp: comment.created ? formatDate(comment.created) : 'Unknown date',
      author: authorId,
      text: text,
      isPinned: comment.isPinned
    };
  });
}

/**
 * Format activities as timeline items
 * @param activities - YouTrack activity objects
 * @param options - Formatting options
 * @param userMap - Map to collect unique users
 * @returns Timeline items from activities
 */
export function formatActivitiesAsTimelineItems(
  activities: any[] | undefined, 
  options: JsonFormatterOptions = {}, 
  userMap: Record<string, SimpleUser> = {}
): SimpleTimelineItem[] {
  if (!activities || activities.length === 0) {
    return [];
  }
  
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Limit the number of activities if maxActivities is set
  const limitedActivities = opts.maxActivities && opts.maxActivities > 0
    ? activities.slice(0, opts.maxActivities)
    : activities;
  
  return limitedActivities.map(activity => {
    // Format and store author in the user map
    const authorId = activity.author?.id || 'unknown';
    if (activity.author && !userMap[authorId]) {
      userMap[authorId] = formatUser(activity.author) || { id: 'unknown', name: 'Unknown User' };
    }
    
    const result: SimpleTimelineItem = {
      id: activity.id,
      type: TimelineItemType.ACTIVITY,
      timestamp: formatDate(activity.timestamp),
      author: authorId,
      activityType: activity.$type
    };
    
    // Add field name if available
    if (activity.field && typeof activity.field === 'object' && 'name' in activity.field) {
      result.field = activity.field.name || undefined;
    }
    
    // Handle added values
    if (activity.added !== undefined) {
      const added = Array.isArray(activity.added) ? activity.added : [activity.added];
      result.addedValues = added.map((item: any) => {
        if (item && typeof item === 'object') {
          return item.name || item.text || item.presentation || 'Unknown value';
        } else if (typeof item === 'string' || typeof item === 'number') {
          return String(item);
        } else {
          return 'Unknown value';
        }
      });
    }
    
    // Handle removed values
    if (activity.removed !== undefined) {
      const removed = Array.isArray(activity.removed) ? activity.removed : [activity.removed];
      result.removedValues = removed.map((item: any) => {
        if (item && typeof item === 'object') {
          return item.name || item.text || item.presentation || 'Unknown value';
        } else if (typeof item === 'string' || typeof item === 'number') {
          return String(item);
        } else {
          return 'Unknown value';
        }
      });
    }
    
    return result;
  });
}

/**
 * Format a YouTrack Issue to a simpler representation
 * @param issue - YouTrack Issue object
 * @param options - Formatting options
 * @returns Simplified Issue object
 */
export function formatIssue(
  issue: any, 
  options: JsonFormatterOptions = {}
): SimpleIssue | null {
  if (!issue) return null;

  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Create a map of unique users for cross-references
  const userMap: Record<string, SimpleUser> = {};
  
  // Add reporter to user map
  if (issue.reporter) {
    const reporter = formatUser(issue.reporter);
    if (reporter) {
      userMap[reporter.id] = reporter;
    }
  }
  
  // Format project
  const project = formatProject(issue.project);
  
  // Get description and apply truncation if needed
  let description = issue.description;
  if (description && opts.maxDescriptionLength && description.length > opts.maxDescriptionLength) {
    description = description.substring(0, opts.maxDescriptionLength) + '... (truncated)';
  }
  
  // Format dates
  const created = issue.created ? formatDate(issue.created) : undefined;
  const updated = issue.updated ? formatDate(issue.updated) : undefined;
  const resolved = issue.resolved ? formatDate(issue.resolved) : undefined;
  
  // Format links
  const links = formatLinks(issue.links || []);
  
  // Format comments and collect users
  const comments = issue.comments 
    ? formatComments(issue.comments, opts, userMap)
    : [];
  
  // Format activities and collect users (if includeActivities is true)
  const activities = opts.includeActivities && issue.activities
    ? formatActivities(issue.activities, opts, userMap)
    : [];
  
  // Format attachments (if includeAttachments is true)
  const attachments = opts.includeAttachments && issue.attachments
    ? formatAttachments(issue.attachments, userMap)
    : [];
  
  // Build the result object
  const result: SimpleIssue = {
    id: issue.id,
    idReadable: issue.idReadable,
    summary: issue.summary,
    project: project || { id: 'unknown', name: 'Unknown Project' },
    users: userMap,
    links: links || [],
    attachments: attachments || [],
    activelyWorkedContributors: [],
  };
  
  // Add optional fields if they exist
  if (description) result.description = description;
  if (created) result.created = created;
  if (updated) result.updated = updated;
  if (resolved !== undefined) result.resolved = resolved;
  if (issue.reporter) result.reporter = issue.reporter.id;
  
  // Add any custom fields
  const customFields = issue.customFields || [];
  for (const field of customFields) {
    if (field && field.name && field.$type === 'CustomField') {
      result[field.name] = field.value?.name || field.value?.text || field.value;
    }
  }
  
  // Add sprint if available
  if (issue.sprint && issue.sprint.id) {
    result.sprint = issue.sprint.id;
  }
  
  // Create timeline from comments and activities if either exists
  if (comments.length > 0 || activities.length > 0) {
    const commentsTimeline = formatCommentsAsTimelineItems(issue.comments, opts, userMap);
    const activitiesTimeline = opts.includeActivities 
      ? formatActivitiesAsTimelineItems(issue.activities, opts, userMap)
      : [];
    
    // Combine and sort by timestamp
    result.timeline = [...commentsTimeline, ...activitiesTimeline]
      .sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return dateA - dateB;
      });
  }
  
  // Add raw data if requested
  if (opts.includeRawData) {
    result._raw = issue;
  }
  
  // Add actively worked contributors
  result.activelyWorkedContributors = getActivelyWorkedContributors(result);
  
  return result;
}

/**
 * Format a YouTrack Sprint to a simpler representation
 * @param sprint - YouTrack Sprint object
 * @param options - Formatting options
 * @returns Simplified Sprint object
 */
export function formatSprint(sprint: any, options: JsonFormatterOptions = {}): SimpleSprint | null {
  if (!sprint) return null;

  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Format dates
  const start = sprint.start ? formatDate(sprint.start) : undefined;
  const finish = sprint.finish ? formatDate(sprint.finish) : undefined;
  
  // Build the result object
  const result: SimpleSprint = {
    id: sprint.id,
    name: sprint.name,
    isActive: !!sprint.isActive,
  };
  
  // Add optional fields if they exist
  if (sprint.goal) result.goal = sprint.goal;
  if (start) result.start = start;
  if (finish) result.finish = finish;
  if (sprint.isCompleted !== undefined) result.isCompleted = sprint.isCompleted;
  if (sprint.isDefault !== undefined) result.isDefault = sprint.isDefault;
  
  // Add issues if they exist
  if (sprint.issues && Array.isArray(sprint.issues)) {
    result.issues = sprint.issues.map((issue: any) => ({
      id: issue.id,
      idReadable: issue.idReadable,
      summary: issue.summary,
      resolved: !!issue.resolved
    }));
  }
  
  // Add unresolved issues count if it exists
  if (sprint.unresolvedIssuesCount !== undefined) {
    result.unresolvedIssuesCount = sprint.unresolvedIssuesCount;
  }
  
  // Add raw data if requested
  if (opts.includeRawData) {
    result._raw = sprint;
  }
  
  return result;
}

/**
 * Format a YouTrack Board to a simpler representation
 * @param board - YouTrack Board object
 * @param options - Formatting options
 * @returns Simplified Board object
 */
export function formatBoard(board: any, options: JsonFormatterOptions = {}): SimpleBoard | null {
  if (!board) {
    return null;
  }
  
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Create a map to collect all unique users
  const userMap: Record<string, SimpleUser> = {};
  
  // Add owner to user map if present
  const ownerId = board.owner?.id || undefined;
  if (board.owner && ownerId) {
    userMap[ownerId] = formatUser(board.owner) || { id: 'unknown', name: 'Unknown User' };
  }
  
  const result: SimpleBoard = {
    id: board.id,
    name: board.name,
    description: board.description,
    owner: ownerId
  };
  
  // Format projects if available
  if (board.projects && board.projects.length > 0) {
    result.projects = board.projects.map((project: any) => formatProject(project) as SimpleProject);
  }
  
  // Format sprints if available
  if (board.sprints && board.sprints.length > 0) {
    result.sprints = board.sprints.map((sprint: any) => formatSprint(sprint, opts) as SimpleSprint);
    
    // Set current sprint
    if (board.currentSprint) {
      result.currentSprint = formatSprint(board.currentSprint, opts) as SimpleSprint;
    }
  }
  
  // Add user map to result if it has any entries
  if (Object.keys(userMap).length > 0) {
    result.users = userMap;
  }
  
  // Include raw data if requested
  if (opts.includeRawData) {
    result._raw = board;
  }
  
  return result;
}

/**
 * Analyze the timeline to extract contributors and their roles.
 * Roles: 'actually did the task', 'did the qa', 'commenter'.
 * @param issue - The formatted SimpleIssue object
 * @returns Array of contributors with userId, name, and roles
 */
export function getIssueContributors(issue: SimpleIssue): Array<{ userId: string, name: string, roles: string[] }> {
  if (!issue.timeline || !issue.users) return [];

  // Heuristic status names for roles
  const doneStatuses = ['Done', 'Resolved', 'Closed', 'Canceled'];
  const qaStatuses = ['QA', 'QA In Progress'];

  // Track actions per user
  const userRoles: Record<string, Set<string>> = {};
  const userHasActivity: Record<string, boolean> = {};

  for (const item of issue.timeline) {
    const userId = item.author;
    if (!userId) continue;
    if (!userRoles[userId]) userRoles[userId] = new Set();

    if (item.type === 'activity') {
      userHasActivity[userId] = true;
      // Check for status changes
      if (item.field && item.field.toLowerCase() === 'stage' && item.addedValues && item.addedValues.length) {
        for (const val of item.addedValues) {
          if (doneStatuses.some(status => val.toLowerCase().includes(status.toLowerCase()))) {
            userRoles[userId].add('actually did the task');
          }
          if (qaStatuses.some(status => val.toLowerCase().includes(status.toLowerCase()))) {
            userRoles[userId].add('did the qa');
          }
        }
      }
      // Also, if activityType is 'StateChangeActivityItem' and addedValues contains a done/qa status
      if (item.activityType && item.activityType.toLowerCase().includes('stage') && item.addedValues && item.addedValues.length) {
        for (const val of item.addedValues) {
          if (doneStatuses.some(status => val.toLowerCase().includes(status.toLowerCase()))) {
            userRoles[userId].add('actually did the task');
          }
          if (qaStatuses.some(status => val.toLowerCase().includes(status.toLowerCase()))) {
            userRoles[userId].add('did the qa');
          }
        }
      }
      // If activityType is 'Resolved' or field is 'resolved', also count as 'actually did the task'
      if ((item.activityType && item.activityType.toLowerCase().includes('resolved')) || (item.field && item.field.toLowerCase() === 'resolved')) {
        userRoles[userId].add('actually did the task');
      }
    } else if (item.type === 'comment') {
      userRoles[userId].add('commenter');
    }
  }

  // If a user only commented (no activity), keep only 'commenter'
  for (const userId of Object.keys(userRoles)) {
    if (!userHasActivity[userId] && userRoles[userId].has('commenter')) {
      userRoles[userId] = new Set(['commenter']);
    }
  }

  // Build the result array
  return Object.entries(userRoles).map(([userId, roles]) => ({
    userId,
    name: issue.users?.[userId]?.name || userId,
    roles: Array.from(roles)
  }));
}

/**
 * Determine actively worked contributors by checking the assignee at the moment
 * the issue changed state to either 'In Progress' or 'QA In Progress'.
 * @param issue - The formatted SimpleIssue object
 * @returns Array of contributors with userId, name, and the state they were assigned at
 */
export function getActivelyWorkedContributors(issue: SimpleIssue): ActivelyWorkedContributor[] {
  if (!issue.timeline || !issue.users) return [];

  // States to check for
  const targetStates = ['In Progress', 'QA In Progress'];

  // Sort timeline oldest to newest
  const timeline = [...issue.timeline].sort((a, b) => {
    if (!a.timestamp || !b.timestamp) return 0;
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });

  let currentAssignee: string | undefined = undefined;
  const contributors: ActivelyWorkedContributor[] = [];
  const seen: Set<string> = new Set(); // To avoid duplicates for same user/state

  for (const item of timeline) {
    // Track assignee changes
    if (item.type === 'activity' && item.field && item.field.toLowerCase() === 'assignee' && item.addedValues && item.addedValues.length > 0) {
      // Only take the first added value (YouTrack usually single assignee)
      const newAssigneeName = item.addedValues[0];
      // Find userId by name (reverse lookup)
      const userId = Object.keys(issue.users).find(uid => issue.users?.[uid]?.name === newAssigneeName);
      if (userId) {
        currentAssignee = userId;
      }
    }
    // Check for state changes
    if (item.type === 'activity' && item.field && item.field.toLowerCase() === 'stage' && item.addedValues && item.addedValues.length > 0) {
      for (const state of item.addedValues) {
        if (state.toLowerCase() === 'in progress') {
          // Use assignee at this moment
          if (currentAssignee && !seen.has(currentAssignee + '|' + state)) {
            contributors.push({
              userId: currentAssignee,
              name: issue.users[currentAssignee]?.name || currentAssignee,
              state
            });
            seen.add(currentAssignee + '|' + state);
          }
        } else if (state.toLowerCase() === 'qa in progress') {
          // Use the author of the stage change
          const qaUserId = item.author;
          if (qaUserId && !seen.has(qaUserId + '|' + state)) {
            contributors.push({
              userId: qaUserId,
              name: issue.users[qaUserId]?.name || qaUserId,
              state
            });
            seen.add(qaUserId + '|' + state);
          }
        }
      }
    }
  }

  return contributors;
} 