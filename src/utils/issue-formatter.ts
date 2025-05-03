import * as YouTrackTypes from '../types/youtrack';

/**
 * Configuration options for the issue formatter
 */
export interface IssueFormatterOptions {
  /** Include markdown formatting (true) or strip markdown (false) */
  preserveMarkdown?: boolean;
  /** Maximum length for description and comments before truncation */
  maxTextLength?: number;
  /** Names of important custom fields that should be prioritized in formatting */
  priorityFields?: string[];
  /** Include raw data for certain fields (for debugging or advanced processing) */
  includeRawData?: boolean;
  /** Include activity history in the output */
  includeActivities?: boolean;
  /** Maximum number of activities to include (0 = all) */
  maxActivities?: number;
  /** Include attachments information */
  includeAttachments?: boolean;
}

/**
 * Default formatter options
 */
const DEFAULT_OPTIONS: IssueFormatterOptions = {
  preserveMarkdown: true,
  maxTextLength: 2000,
  priorityFields: ['Type', 'Priority', 'Stage', 'Assignee', 'Fix versions', 'Sprint', 'Category'],
  includeRawData: false,
  includeActivities: true,
  maxActivities: 40,
  includeAttachments: true
};

/**
 * Formats a YouTrack Issue object into an AI-readable text format for reporting
 * @param issue - The YouTrack Issue object to format
 * @param options - Formatting options
 * @returns A formatted text representation of the issue
 */
export function formatIssueForAI(
  issue: YouTrackTypes.Issue | YouTrackTypes.IssueWithActivities, 
  options: IssueFormatterOptions = {}
): string {
  try {
    // Merge default options with provided options
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    const sections: string[] = [];
    
    // Issue header
    sections.push(`# ISSUE: ${issue.idReadable || issue.id || 'Unknown ID'}`);
    
    // Basic info section
    sections.push(formatBasicInfo(issue));
    
    // Add contributors section (people who worked on the issue)
    if ('activities' in issue && issue.activities && issue.activities.length > 0) {
      const contributorsInfo = extractContributors(issue.activities);
      if (contributorsInfo) {
        sections.push(contributorsInfo);
      }
    }
    
    // Description section (if available)
    if (issue.description) {
      let description = issue.description;
      
      // Handle markdown or truncate if needed
      if (!opts.preserveMarkdown && issue.usesMarkdown) {
        // Simple markdown stripping (a more sophisticated approach would be better in production)
        description = stripMarkdown(description);
      }
      
      // Truncate if too long
      if (opts.maxTextLength && description.length > opts.maxTextLength) {
        description = description.substring(0, opts.maxTextLength) + '\n[... Content truncated ...]';
      }
      
      sections.push(`## DESCRIPTION\n${description}`);
    }
    
    // Custom fields section (if available)
    if (issue.customFields && issue.customFields.length > 0) {
      sections.push(formatCustomFields(issue.customFields, opts.priorityFields));
    }
    
    // Comments section (if available)
    if (issue.comments && issue.comments.length > 0) {
      sections.push(formatComments(issue.comments, opts));
    }
    
    // Links section (if available)
    if (issue.links && issue.links.length > 0) {
      sections.push(formatLinks(issue.links));
    }

    // Attachments section (if available and has attachments)
    if (opts.includeAttachments && issue.attachments && issue.attachments.length > 0) {
      sections.push(formatAttachments(issue.attachments));
    }

    // Add activity history if available and requested
    if (opts.includeActivities && 'activities' in issue && issue.activities && issue.activities.length > 0) {
      sections.push(formatActivities(issue.activities, opts.maxActivities));
    }

    // Add sprint information if available through custom fields
    const sprintInfo = extractSprintInformation(issue);
    if (sprintInfo) {
      sections.push(sprintInfo);
    }
    
    // Add raw data section if requested
    if (opts.includeRawData) {
      sections.push(`## RAW DATA\n\`\`\`json\n${JSON.stringify(issue, null, 2)}\n\`\`\``);
    }
    
    return sections.join('\n\n');
  } catch (error) {
    // Fallback error handling to ensure we return something useful
    console.error('Error formatting issue:', error);
    return `# ERROR FORMATTING ISSUE: ${issue.idReadable || issue.id || 'Unknown'}\n\nThere was an error formatting this issue. Basic information:\nID: ${issue.idReadable || issue.id || 'Unknown'}\nSummary: ${issue.summary || 'Unknown'}\n`;
  }
}

/**
 * Formats the basic information section of an issue
 * @param issue - The YouTrack Issue object
 * @returns Formatted basic info section
 */
function formatBasicInfo(issue: YouTrackTypes.Issue): string {
  try {
    const lines: string[] = [];
    
    lines.push(`## BASIC INFO`);
    lines.push(`ID: ${issue.idReadable || issue.id || 'Unknown'}`);
    lines.push(`Summary: ${issue.summary || 'No summary provided'}`);
    
    if (issue.created) {
      lines.push(`Created: ${formatDate(issue.created)}`);
    }
    
    if (issue.updated) {
      lines.push(`Updated: ${formatDate(issue.updated)}`);
    }
    
    // Format resolved status
    if (typeof issue.resolved === 'number') {
      lines.push(`Resolved: Yes (${formatDate(issue.resolved)})`);
    } else if (issue.resolved === true) {
      lines.push(`Resolved: Yes`);
    } else if (issue.resolved === false || issue.resolved === null) {
      lines.push(`Resolved: No`);
    } else {
      lines.push(`Resolved: Unknown`);
    }
    
    // Format reporter info
    if (issue.reporter) {
      const email = issue.reporter.email ? ` (${issue.reporter.email})` : '';
      const name = issue.reporter.fullName || issue.reporter.name || issue.reporter.login || 'Unknown';
      lines.push(`Reporter: ${name}${email}`);
    }
    
    // Include project if available
    if (issue.project) {
      lines.push(`Project: ${issue.project.name || 'Unknown'} (${issue.project.shortName || issue.project.id || 'Unknown ID'})`);
    }
    
    return lines.join('\n');
  } catch (error) {
    console.error('Error formatting basic info:', error);
    return '## BASIC INFO\nError formatting basic information';
  }
}

/**
 * Formats custom fields from an issue
 * @param customFields - Array of custom fields
 * @param priorityFields - Array of field names that should be listed first
 * @returns Formatted custom fields section
 */
function formatCustomFields(
  customFields: YouTrackTypes.AnyIssueCustomField[],
  priorityFields: string[] = []
): string {
  try {
    const lines: string[] = [];
    lines.push(`## CUSTOM FIELDS`);
    
    // Create a copy to avoid modifying the original array
    const fields = [...customFields];
    
    // Sort fields to prioritize important ones
    if (priorityFields && priorityFields.length > 0) {
      fields.sort((a, b) => {
        const aIndex = priorityFields.indexOf(a.name);
        const bIndex = priorityFields.indexOf(b.name);
        
        // If both are priority fields, sort by their order in the priority list
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        
        // If only a is a priority field, it comes first
        if (aIndex !== -1) {
          return -1;
        }
        
        // If only b is a priority field, it comes first
        if (bIndex !== -1) {
          return 1;
        }
        
        // Otherwise, sort alphabetically
        return a.name.localeCompare(b.name);
      });
    }
    
    for (const field of fields) {
      const fieldName = field.name;
      let fieldValue = 'Not set';
      
      // Format the value based on the field type
      try {
        switch (field.$type) {
          case 'SingleEnumIssueCustomField':
            const enumField = field as YouTrackTypes.SingleEnumIssueCustomField;
            fieldValue = enumField.value ? enumField.value.name : 'Not set';
            break;
            
          case 'StateIssueCustomField':
            const stateField = field as YouTrackTypes.StateIssueCustomField;
            if (stateField.value) {
              const resolvedStatus = stateField.value.isResolved ? ' (Resolved)' : '';
              fieldValue = `${stateField.value.name}${resolvedStatus}`;
            }
            break;
            
          case 'SingleUserIssueCustomField':
            const userField = field as YouTrackTypes.SingleUserIssueCustomField;
            if (userField.value) {
              const email = userField.value.email ? ` (${userField.value.email})` : '';
              const name = userField.value.fullName || userField.value.name || userField.value.login || 'Unknown';
              fieldValue = `${name}${email}`;
            }
            break;
            
          case 'MultiUserIssueCustomField':
            const multiUserField = field as YouTrackTypes.MultiUserIssueCustomField;
            if (multiUserField.value && multiUserField.value.length > 0) {
              fieldValue = multiUserField.value.map(user => {
                const email = user.email ? ` (${user.email})` : '';
                const name = user.fullName || user.name || user.login || 'Unknown';
                return `${name}${email}`;
              }).join(', ');
            }
            break;
            
          case 'SimpleIssueCustomField':
            const simpleField = field as YouTrackTypes.SimpleIssueCustomField;
            fieldValue = simpleField.value !== null ? String(simpleField.value) : 'Not set';
            break;
            
          case 'PeriodIssueCustomField':
            const periodField = field as YouTrackTypes.PeriodIssueCustomField;
            if (periodField.value && periodField.value.id) {
              // PeriodValue.id format is typically PT4H30M (4 hours 30 minutes)
              fieldValue = formatPeriodValue(periodField.value.id);
            } else {
              fieldValue = 'Not set';
            }
            break;
            
          default:
            fieldValue = 'Unknown format';
        }
      } catch (error) {
        fieldValue = `Error formatting field: ${error}`;
      }
      
      lines.push(`${fieldName}: ${fieldValue}`);
    }
    
    return lines.join('\n');
  } catch (error) {
    console.error('Error formatting custom fields:', error);
    return '## CUSTOM FIELDS\nError formatting custom fields';
  }
}

/**
 * Formats the period value from ISO 8601 duration format
 * @param periodId - Period ID (e.g., "PT4H30M")
 * @returns Formatted period string
 */
function formatPeriodValue(periodId: string): string {
  try {
    // Parse the duration format
    // Example: PT4H30M = 4 hours 30 minutes
    const regex = /PT(?:(\d+)D)?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = periodId.match(regex);
    
    if (!matches) return periodId;
    
    const days = matches[1] ? parseInt(matches[1]) : 0;
    const hours = matches[2] ? parseInt(matches[2]) : 0;
    const minutes = matches[3] ? parseInt(matches[3]) : 0;
    const seconds = matches[4] ? parseInt(matches[4]) : 0;
    
    const parts: string[] = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    if (seconds > 0) parts.push(`${seconds} second${seconds > 1 ? 's' : ''}`);
    
    return parts.length > 0 ? parts.join(' ') : periodId;
  } catch (error) {
    console.error('Error formatting period value:', error);
    return periodId;
  }
}

/**
 * Formats comments from an issue
 * @param comments - Array of issue comments
 * @param options - Formatting options
 * @returns Formatted comments section
 */
function formatComments(
  comments: YouTrackTypes.IssueComment[],
  options: IssueFormatterOptions = {}
): string {
  try {
    const lines: string[] = [];
    lines.push(`## COMMENTS (${comments.length})`);
    
    // Sort comments by created date (oldest first)
    const sortedComments = [...comments].sort((a, b) => {
      if (!a.created) return -1;
      if (!b.created) return 1;
      return a.created - b.created;
    });
    
    for (const comment of sortedComments) {
      const author = comment.author 
        ? (comment.author.fullName || comment.author.name || comment.author.login || 'Unknown')
        : 'Unknown';
      
      const date = comment.created 
        ? formatDate(comment.created)
        : 'Unknown date';
      
      let commentText = comment.text || '';
      
      // Handle markdown stripping if needed
      if (!options.preserveMarkdown) {
        commentText = stripMarkdown(commentText);
      }
      
      // Truncate if too long
      if (options.maxTextLength && commentText.length > options.maxTextLength) {
        commentText = commentText.substring(0, options.maxTextLength) + '\n[... Comment truncated ...]';
      }
      
      lines.push(`### Comment by ${author} on ${date}`);
      
      if (commentText) {
        lines.push(commentText);
      } else {
        lines.push('(No comment text)');
      }
      
      // Add attachment info if available
      if (options.includeAttachments && comment.attachments && comment.attachments.length > 0) {
        lines.push(`Attachments: ${comment.attachments.map(att => att.name).join(', ')}`);
      }
      
      lines.push('---');
    }
    
    return lines.join('\n');
  } catch (error) {
    console.error('Error formatting comments:', error);
    return '## COMMENTS\nError formatting comments';
  }
}

/**
 * Formats links from an issue
 * @param links - Array of issue links
 * @returns Formatted links section
 */
function formatLinks(links: YouTrackTypes.IssueLink[]): string {
  try {
    const lines: string[] = [];
    lines.push(`## LINKS (${links.length})`);
    
    for (const link of links) {
      const linkType = link.linkType;
      const relationName = getLinkRelationName(link);
      
      if (link.issues && link.issues.length > 0) {
        lines.push(`### ${relationName} (${link.issues.length})`);
        
        for (const linkedIssue of link.issues) {
          const resolved = linkedIssue.resolved 
            ? typeof linkedIssue.resolved === 'number'
              ? ` (Resolved on: ${formatDate(linkedIssue.resolved)})`
              : ' (Resolved)'
            : '';
          
          lines.push(`- ${linkedIssue.idReadable || linkedIssue.id}: ${linkedIssue.summary || 'No summary'}${resolved}`);
        }
      } else if (link.trimmedIssues && link.trimmedIssues.length > 0) {
        // Some API responses include a trimmed list of issues
        lines.push(`### ${relationName} (${link.issuesSize || link.trimmedIssues.length})`);
        
        for (const linkedIssue of link.trimmedIssues) {
          const resolved = linkedIssue.resolved 
            ? typeof linkedIssue.resolved === 'number'
              ? ` (Resolved on: ${formatDate(linkedIssue.resolved)})`
              : ' (Resolved)'
            : '';
          
          lines.push(`- ${linkedIssue.idReadable || linkedIssue.id}: ${linkedIssue.summary || 'No summary'}${resolved}`);
        }
        
        // If the API indicates there are more issues than shown, add a note
        if (link.issuesSize && link.issuesSize > link.trimmedIssues.length) {
          lines.push(`  ... and ${link.issuesSize - link.trimmedIssues.length} more issues`);
        }
      }
    }
    
    return lines.join('\n');
  } catch (error) {
    console.error('Error formatting links:', error);
    return '## LINKS\nError formatting links';
  }
}

/**
 * Get the appropriate relation name based on link type and direction
 * @param link - Issue link
 * @returns Relation name to display
 */
function getLinkRelationName(link: YouTrackTypes.IssueLink): string {
  try {
    if (!link.linkType) return 'Related';
    
    const linkType = link.linkType;
    
    if (link.direction === 'INWARD') {
      return linkType.targetToSource || 'Related to';
    } else if (link.direction === 'OUTWARD') {
      return linkType.sourceToTarget || 'Related to';
    } else if (link.direction === 'BOTH') {
      return linkType.directed ? linkType.sourceToTarget : linkType.name;
    } else {
      // Default fallback if no direction specified
      return linkType.name || 'Related';
    }
  } catch (error) {
    console.error('Error getting link relation name:', error);
    return 'Related';
  }
}

/**
 * Formats attachments from an issue
 * @param attachments - Array of issue attachments
 * @returns Formatted attachments section
 */
function formatAttachments(attachments: YouTrackTypes.IssueAttachment[]): string {
  try {
    const lines: string[] = [];
    lines.push(`## ATTACHMENTS (${attachments.length})`);
    
    for (const attachment of attachments) {
      const author = attachment.author
        ? (attachment.author.fullName || attachment.author.name || attachment.author.login || 'Unknown')
        : 'Unknown';
      
      const date = attachment.created
        ? formatDate(attachment.created)
        : 'Unknown date';
        
      const size = attachment.size
        ? formatFileSize(attachment.size)
        : 'Unknown size';
      
      const mimeType = attachment.mimeType || 'Unknown type';
      
      lines.push(`- ${attachment.name} (${size}, ${mimeType}) - Added by ${author} on ${date}`);
    }
    
    return lines.join('\n');
  } catch (error) {
    console.error('Error formatting attachments:', error);
    return '## ATTACHMENTS\nError formatting attachments';
  }
}

/**
 * Formats issue activity history
 * @param activities - Array of activity items
 * @param maxActivities - Maximum number of activities to include
 * @returns Formatted activities section
 */
function formatActivities(
  activities: YouTrackTypes.ActivityItem[],
  maxActivities: number = 0
): string {
  try {
    const lines: string[] = [];
    
    // Sort activities by timestamp (newest first)
    const sortedActivities = [...activities].sort((a, b) => b.timestamp - a.timestamp);
    
    // Limit the number of activities if maxActivities is specified
    const limitedActivities = maxActivities > 0 
      ? sortedActivities.slice(0, maxActivities)
      : sortedActivities;
    
    lines.push(`## ACTIVITY HISTORY (${activities.length}${maxActivities > 0 && activities.length > maxActivities ? `, showing latest ${maxActivities}` : ''})`);
    
    for (const activity of limitedActivities) {
      const date = formatDate(activity.timestamp);
      const author = activity.author 
        ? (activity.author.fullName || activity.author.name || activity.author.login || 'Unknown')
        : 'Unknown';
      
      let activityDesc = '';
      
      switch (activity.$type) {
        case 'CommentActivityItem':
          activityDesc = `Added comment`;
          break;
          
        case 'IssueCreatedActivityItem':
          activityDesc = `Created issue`;
          break;
          
        case 'CustomFieldActivityItem':
          // Field changes (most common)
          const fieldName = activity.field ? (activity.field.name || 'Unknown field') : 'Unknown field';
          const added = activity.added && activity.added.length > 0
            ? activity.added.map(item => item.name || String(item.id || '')).join(', ')
            : '';
          const removed = activity.removed && activity.removed.length > 0
            ? activity.removed.map(item => item.name || String(item.id || '')).join(', ')
            : '';
          
          if (added && removed) {
            activityDesc = `Changed ${fieldName} from "${removed}" to "${added}"`;
          } else if (added) {
            activityDesc = `Set ${fieldName} to "${added}"`;
          } else if (removed) {
            activityDesc = `Removed ${fieldName} value "${removed}"`;
          } else {
            activityDesc = `Updated ${fieldName}`;
          }
          break;
          
        case 'WorkItemActivityItem':
          activityDesc = `Updated work item`;
          break;
          
        case 'SimpleValueActivityItem':
          const simpleName = activity.field ? (activity.field.name || 'value') : 'value';
          activityDesc = `Updated ${simpleName}`;
          break;
          
        case 'VisibilityGroupActivityItem':
          activityDesc = `Changed visibility`;
          break;
          
        default:
          activityDesc = `${activity.$type || 'Unknown activity'}`;
      }
      
      lines.push(`- ${date}: ${author} - ${activityDesc}`);
    }
    
    return lines.join('\n');
  } catch (error) {
    console.error('Error formatting activities:', error);
    return '## ACTIVITY HISTORY\nError formatting activity history';
  }
}

/**
 * Extracts and formats sprint information from an issue
 * @param issue - The YouTrack Issue object
 * @returns Formatted sprint section or null if no sprint info is found
 */
function extractSprintInformation(issue: YouTrackTypes.Issue): string | null {
  try {
    if (!issue.customFields || issue.customFields.length === 0) {
      return null;
    }
    
    // Find the sprint-related custom field(s)
    const sprintFields = issue.customFields.filter(field => 
      field.name?.toLowerCase().includes('sprint') && 
      field.$type === 'SingleEnumIssueCustomField'
    );
    
    if (sprintFields.length === 0) {
      return null;
    }
    
    const lines: string[] = [];
    lines.push(`## SPRINT INFORMATION`);
    
    for (const field of sprintFields) {
      const sprintField = field as YouTrackTypes.SingleEnumIssueCustomField;
      if (sprintField.value) {
        lines.push(`${field.name}: ${sprintField.value.name}`);
      }
    }
    
    if (lines.length <= 1) {
      return null;
    }
    
    return lines.join('\n');
  } catch (error) {
    console.error('Error extracting sprint information:', error);
    return null;
  }
}

/**
 * Formats a timestamp as a readable date string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string
 */
function formatDate(timestamp: number): string {
  try {
    const date = new Date(timestamp);
    return date.toISOString().replace('T', ' ').substring(0, 19);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Formats a file size in bytes to a human-readable string
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
function formatFileSize(bytes: number): string {
  try {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
  } catch (error) {
    console.error('Error formatting file size:', error);
    return 'Unknown size';
  }
}

/**
 * Basic function to strip markdown formatting from text
 * @param text - Markdown text to strip
 * @returns Plain text without markdown
 */
function stripMarkdown(text: string): string {
  if (!text) return '';
  
  let result = text;
  
  // Remove code blocks
  result = result.replace(/```[\s\S]*?```/g, '[CODE BLOCK]');
  
  // Remove inline code
  result = result.replace(/`([^`]+)`/g, '$1');
  
  // Remove headers
  result = result.replace(/^#{1,6}\s+(.+)$/gm, '$1');
  
  // Remove bold/italic
  result = result.replace(/\*\*(.+?)\*\*/g, '$1');
  result = result.replace(/\*(.+?)\*/g, '$1');
  result = result.replace(/_(.+?)_/g, '$1');
  
  // Remove links but keep the text
  result = result.replace(/\[(.+?)\]\(.+?\)/g, '$1');
  
  // Remove images
  result = result.replace(/!\[.*?\]\(.+?\)(\{.*?\})?/g, '[IMAGE]');
  
  // Remove horizontal rules
  result = result.replace(/^---+$/gm, '');
  
  return result;
}

/**
 * Extract contributors who actually worked on the issue (changed stage to in progress or QA)
 * @param activities - Array of activity items
 * @returns Formatted contributors section or null if no contributors found
 */
function extractContributors(activities: YouTrackTypes.ActivityItem[]): string | null {
  try {
    // Track unique contributors by their ID
    const contributors: Record<string, {
      user: YouTrackTypes.User;
      actions: Set<string>;
      date: number;
    }> = {};
    
    // Stage changes we're interested in (case insensitive)
    // Only track actual development work stages, excluding QA and testing
    const workStages = ['in progress', 'qa in progress']; // Removed 'qa' and 'testing'
    
    // Other fields that indicate work was done
    const workFields = ['Assignee', 'QA', 'Reviewer'];
    
    // Keep track of current assignee
    let currentAssignee: YouTrackTypes.User | null = null;

    // First sort activities by timestamp (oldest first) to track assignee changes properly
    const sortedActivities = [...activities].sort((a, b) => a.timestamp - b.timestamp);
    
    // First pass: track assignee changes
    for (const activity of sortedActivities) {
      if (activity.$type === 'CustomFieldActivityItem' && 
          activity.field && 
          activity.field.name === 'Assignee' &&
          activity.added && 
          activity.added.length > 0) {
        
        const assigneeChange = activity.added.find(item => item.$type === 'User');
        if (assigneeChange) {
          currentAssignee = assigneeChange as YouTrackTypes.User;
        }
      }

      // Now process stage changes using the current assignee
      if (activity.$type === 'CustomFieldActivityItem' && 
          activity.field && 
          activity.field.name === 'Stage' && 
          activity.added && 
          activity.added.length > 0) {
        
        // Check if any of the added values match our work stages
        const matchingStage = activity.added.find(item => 
          workStages.some(stage => 
            item.name && item.name.toLowerCase().includes(stage.toLowerCase())
          )
        );
        
        if (matchingStage && matchingStage.name) {
          // Use the current assignee instead of the person who changed the stage
          if (currentAssignee && currentAssignee.id) {
            addContributor(
              contributors, 
              currentAssignee, 
              `Worked on issue in stage ${matchingStage.name}`, 
              activity.timestamp
            );
          }
        }
      }
    }
    
    // Second pass: process other activities
    for (const activity of sortedActivities) {
      if (activity.$type === 'CustomFieldActivityItem' && 
          activity.field && 
          activity.author) {
            
        // Check for assignments of work-related fields
        if (activity.field.name && workFields.includes(activity.field.name) && 
            activity.added && 
            activity.added.length > 0) {
          
          // Find users in added activities
          for (const added of activity.added) {
            if (added.$type === 'User') {
              const userAdded = added as YouTrackTypes.User;
              
              // Only the assigned person is considered a contributor
              if (userAdded.id && userAdded.$type === 'User') {
                addContributor(
                  contributors,
                  userAdded,
                  `Was assigned as ${activity.field.name}`,
                  activity.timestamp
                );
              }
            }
          }
        }
      }
      
      // Also include people who commented
      else if (activity.$type === 'CommentActivityItem' && activity.author) {
        addContributor(
          contributors,
          activity.author,
          'Added comment',
          activity.timestamp
        );
      }
    }
    
    // If no contributors found
    if (Object.keys(contributors).length === 0) {
      return null;
    }
    
    // Format contributors section
    const lines: string[] = [];
    lines.push(`## CONTRIBUTORS`);
    lines.push(`Users who worked on this issue:`);
    
    // Sort contributors by date (most recent first)
    const sortedContributors = Object.values(contributors).sort((a, b) => b.date - a.date);
    
    for (const contributor of sortedContributors) {
      const name = contributor.user.fullName || contributor.user.name || contributor.user.login || 'Unknown';
      const email = contributor.user.email ? ` (${contributor.user.email})` : '';
      const actions = Array.from(contributor.actions).join(', ');
      const date = formatDate(contributor.date);
      
      lines.push(`- ${name}${email}: ${actions} on ${date}`);
    }
    
    return lines.join('\n');
  } catch (error) {
    console.error('Error extracting contributors:', error);
    return null;
  }
}

/**
 * Helper to add a contributor to the contributors record
 */
function addContributor(
  contributors: Record<string, { user: YouTrackTypes.User; actions: Set<string>; date: number }>,
  user: YouTrackTypes.User,
  action: string,
  timestamp: number
): void {
  const userId = user.id;
  
  if (!contributors[userId]) {
    contributors[userId] = {
      user,
      actions: new Set<string>(),
      date: timestamp
    };
  }
  
  contributors[userId].actions.add(action);
  
  // Update to the most recent date if this activity is newer
  if (timestamp > contributors[userId].date) {
    contributors[userId].date = timestamp;
  }
}

/**
 * Formats multiple YouTrack Issue objects into an AI-readable text format
 * @param issues - Array of YouTrack Issue objects
 * @param options - Formatting options
 * @returns Formatted text representing all issues
 */
export function formatIssuesForAI(
  issues: (YouTrackTypes.Issue | YouTrackTypes.IssueWithActivities)[], 
  options: IssueFormatterOptions = {}
): string {
  try {
    if (!issues || issues.length === 0) {
      return '# NO ISSUES FOUND';
    }
    
    // Create a copy of options with abbreviated settings for multiple issues
    const multiIssueOptions: IssueFormatterOptions = {
      ...options,
      maxTextLength: options.maxTextLength || 500, // Use shorter text for multiple issues
      includeRawData: false, // Never include raw data for multiple issues
      includeActivities: false, // Skip activities for multiple issues view
      includeAttachments: false // Skip attachments for multiple issues view
    };
    
    const sections: string[] = [];
    
    // Add a summary header
    sections.push(`# ISSUES SUMMARY (${issues.length} issues)`);
    
    // Add a brief overview table
    sections.push(formatIssuesOverview(issues));
    
    // Format each issue
    for (const issue of issues) {
      sections.push(formatIssueForAI(issue, multiIssueOptions));
    }
    
    return sections.join('\n\n');
  } catch (error) {
    console.error('Error formatting multiple issues:', error);
    return '# ERROR FORMATTING ISSUES\n\nThere was an error formatting the issues.';
  }
}

/**
 * Creates a summary overview of multiple issues
 * @param issues - Array of YouTrack Issue objects
 * @returns Formatted overview section
 */
function formatIssuesOverview(issues: YouTrackTypes.Issue[]): string {
  try {
    const lines: string[] = [];
    lines.push(`## OVERVIEW`);
    
    // Create a simple table header
    lines.push(`| ID | Type | Priority | State | Summary |`);
    lines.push(`| --- | --- | --- | --- | --- |`);
    
    // Add each issue as a row
    for (const issue of issues) {
      const id = issue.idReadable || issue.id || 'Unknown';
      
      // Extract common custom fields
      let type = 'Unknown';
      let priority = 'Unknown';
      let state = 'Unknown';
      
      if (issue.customFields) {
        // Find Type field
        const typeField = issue.customFields.find(field => 
          field.name === 'Type' && field.$type === 'SingleEnumIssueCustomField'
        ) as YouTrackTypes.SingleEnumIssueCustomField | undefined;
        if (typeField && typeField.value) {
          type = typeField.value.name;
        }
        
        // Find Priority field
        const priorityField = issue.customFields.find(field => 
          field.name === 'Priority' && field.$type === 'SingleEnumIssueCustomField'
        ) as YouTrackTypes.SingleEnumIssueCustomField | undefined;
        if (priorityField && priorityField.value) {
          priority = priorityField.value.name;
        }
        
        // Find Stage field
        const stateField = issue.customFields.find(field => 
          field.name === 'Stage' && field.$type === 'StateIssueCustomField'
        ) as YouTrackTypes.StateIssueCustomField | undefined;
        if (stateField && stateField.value) {
          state = stateField.value.name;
          if (stateField.value.isResolved) {
            state += ' (Resolved)';
          }
        }
      }
      
      // Truncate summary if needed
      const summary = issue.summary 
        ? issue.summary.length > 50
          ? issue.summary.substring(0, 47) + '...'
          : issue.summary
        : 'No summary';
      
      lines.push(`| ${id} | ${type} | ${priority} | ${state} | ${summary} |`);
    }
    
    return lines.join('\n');
  } catch (error) {
    console.error('Error formatting issues overview:', error);
    return '## OVERVIEW\nError creating issues overview';
  }
} 