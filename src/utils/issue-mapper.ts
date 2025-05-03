import type { ActivityItem, Issue } from '../types/youtrack';

/**
 * Helper interface to track contributor information
 */
interface Contributor {
  id: string;
  name: string;
  login: string;
  email?: string;
  roles: Set<string>;
  activities: Array<{
    date: Date;
    action: string;
  }>;
}

/**
 * Maps a YouTrack issue to an AI-readable text format with all meaningful properties
 * @param issue The YouTrack issue to format
 * @param activities Optional activities related to this issue
 * @returns A formatted string representation of the issue
 */
export function mapIssueToAIReadableText(issue: Issue, activities?: ActivityItem[]): string {
  // Cast issue to any to access properties which might not be in the type definition
  const issueData = issue as any;

  console.error(JSON.stringify(issue, null, 2));
  
  // Basic issue information
  let result = `Issue ID: ${issue.id}
ID Readable: ${issueData.idReadable || issue.id}
Summary: ${issue.summary}
Status: ${issue.resolved ? 'Resolved' : 'Open'}
Project: ${issueData.project?.name || 'Unknown'} (${issueData.project?.shortName || 'N/A'})
`;

  // Format timestamps
  const createdDate = issueData.created ? new Date(issueData.created) : null;
  const updatedDate = issueData.updated ? new Date(issueData.updated) : null;
  const resolvedDate = issueData.resolved ? new Date(issueData.resolved) : null;

  result += `Created: ${createdDate ? createdDate.toLocaleString() : 'Unknown'}
Updated: ${updatedDate ? updatedDate.toLocaleString() : 'Unknown'}
${resolvedDate ? `Resolved: ${resolvedDate.toLocaleString()}\n` : ''}`;

  // Track all contributors to the issue
  const contributors = new Map<string, Contributor>();
  
  // Track users who actually started working on the issue
  const actualWorkers: Array<{
    user: string;
    date: Date;
  }> = [];

  // Helper to add a contributor to our tracking
  const addContributor = (person: any, role: string, date?: Date, action?: string) => {
    if (!person) return;
    
    // Use login or ID as a unique key
    const key = person.login || person.id;
    if (!key) return;
    
    let contributor = contributors.get(key);
    
    if (!contributor) {
      contributor = {
        id: person.id || '',
        name: person.fullName || person.name || person.login || 'Unknown',
        login: person.login || 'Unknown',
        email: person.email,
        roles: new Set<string>(),
        activities: []
      };
      contributors.set(key, contributor);
    }
    
    // Add the role
    contributor.roles.add(role);
    
    // Add activity if provided
    if (date && action) {
      contributor.activities.push({
        date,
        action
      });
    }
  };

  // Reporter
  if (issueData.reporter) {
    const reporter = issueData.reporter;
    result += `Reporter: ${reporter.fullName || reporter.login || 'Unknown'} (${reporter.email || 'No email'})\n`;
    
    // Add reporter to contributors
    addContributor(reporter, 'Reporter', createdDate || undefined, 'Created issue');
  }
  
  // Assignee(s)
  if (issueData.assignee || issueData.assignees) {
    const assignees = issueData.assignees || (issueData.assignee ? [issueData.assignee] : []);
    if (assignees.length > 0) {
      result += `Assignee(s): ${assignees.map((a: any) => `${a.fullName || a.login || 'Unknown'}`).join(', ')}\n`;
      
      // Add assignees to contributors
      assignees.forEach((assignee: any) => {
        addContributor(assignee, 'Assignee');
      });
    }
  }

  // Updater (last person who modified the issue)
  if (issueData.updater) {
    result += `Last Updated By: ${issueData.updater.fullName || issueData.updater.login || 'Unknown'}\n`;
    
    // Add updater to contributors
    addContributor(issueData.updater, 'Updater', updatedDate || undefined, 'Last updated issue');
  }

  // Draft status
  if (issueData.isDraft !== undefined) {
    result += `Draft: ${issueData.isDraft ? 'Yes' : 'No'}\n`;
  }

  // Priority, Type, etc.
  if (issueData.priority) {
    result += `\nPriority: ${issueData.priority.name || issueData.priority}\n`;
  }
  
  if (issueData.type) {
    result += `Type: ${issueData.type.name || issueData.type}\n`;
  }

  // Extract custom fields for better reporting
  const fields = issueData.fields || [];
  if (fields.length > 0) {
    for (const field of fields) {
      let value = field.value;
      
      // Handle different value types
      if (value === null || value === undefined) {
        value = 'Not set';
      } else if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          value = value.map((v: any) => v.name || v.fullName || v.login || v).join(', ');
        } else {
          // Handle state, enum, and user objects
          value = value.name || value.fullName || value.login || JSON.stringify(value);
        }
      }
      
      result += `${field.name}: ${value}\n`;
    }
  }

  // Description
  result += `\nDescription:\n${issueData.description || 'No description'}\n`;

  // Votes
  if (issueData.votes !== undefined) {
    result += `Votes: ${issueData.votes}\n`;
  }

  // Tags
  if (issueData.tags && issueData.tags.length > 0) {
    result += `\nTags: ${issueData.tags.map((t: any) => t.name || t).join(', ')}\n`;
  }

  // Due date
  if (issueData.dueDate) {
    const dueDate = new Date(issueData.dueDate);
    result += `Due Date: ${dueDate.toLocaleString()}\n`;
  }

  // Time tracking
  if (issueData.timeTracking) {
    const tt = issueData.timeTracking;
    result += `\nTime Tracking:
  Estimate: ${tt.estimate || 'Not set'}
  Spent Time: ${tt.spent || 'Not recorded'}\n`;
  }

  // Sprints
  if (issueData.sprints && issueData.sprints.length > 0) {
    result += `\nSprints: ${issueData.sprints.map((s: any) => s.name).join(', ')}\n`;
  } else if (fields.find(f => f.name === 'Sprint' && f.value)) {
    // If sprint is in custom fields but not directly on the issue
    const sprintField = fields.find(f => f.name === 'Sprint' && f.value);
    if (sprintField) {
      result += `\nSprint: ${sprintField.value.name || sprintField.value}\n`;
    }
  }

  // Story Points - common agile metric
  const storyPointsField = fields.find(f => f.name === 'Story points' || f.name === 'Story Points');
  if (storyPointsField && storyPointsField.value) {
    result += `Story Points: ${storyPointsField.value}\n`;
  }

  // Visibility
  if (issueData.visibility) {
    result += `Visibility: ${issueData.visibility.$type || 'Standard'}\n`;
  }

  // Watchers
  if (issueData.watchers) {
    if (Array.isArray(issueData.watchers)) {
      result += `\nWatchers: ${issueData.watchers.length} (${issueData.watchers.map((w: any) => w.fullName || w.login).join(', ')})\n`;
      
      // Add watchers to contributors
      issueData.watchers.forEach((watcher: any) => {
        addContributor(watcher, 'Watcher');
      });
    } else if (issueData.watchers.hasStar !== undefined) {
      result += `Watched: ${issueData.watchers.hasStar ? 'Yes' : 'No'}\n`;
    }
  }

  // Linked issues
  if (issueData.links && issueData.links.length > 0) {
    result += '\nLinked Issues:\n';
    for (const link of issueData.links) {
      if (link.issues && link.issues.length > 0) {
        const linkName = link.linkType?.sourceToTarget || link.direction || link.linkType?.name || 'related to';
        result += `  ${linkName}: ${link.issues.map((li: any) => `${li.id} (${li.summary})`).join(', ')}\n`;
      } else if (link.trimmedIssues && link.trimmedIssues.length > 0) {
        const linkName = link.linkType?.sourceToTarget || link.direction || link.linkType?.name || 'related to';
        result += `  ${linkName}: ${link.trimmedIssues.map((li: any) => `${li.id} (${li.summary})`).join(', ')}\n`;
      }
    }
  }

  // Attachments
  if (issueData.attachments && issueData.attachments.length > 0) {
    result += '\nAttachments:\n';
    for (const att of issueData.attachments) {
      const created = att.created ? new Date(att.created) : null;
      result += `  ${att.name} (${att.size || 'Unknown size'}) - Added by ${att.author?.fullName || att.author?.login || 'Unknown'} on ${created ? created.toLocaleString() : 'Unknown date'}\n`;
      
      // Add attachment author to contributors
      if (att.author && created) {
        addContributor(att.author, 'Attachment Author', created, `Added attachment: ${att.name}`);
      }
    }
  }

  // Format activity/history for status changes if available
  // Use the activities parameter if provided, otherwise fallback to issueData.activities
  const activityItems = activities || issueData.activities || [];
  if (activityItems.length > 0) {
    result += '\nActivity History:\n';
    
    // Sort activities by timestamp if available
    const sortedActivities = [...activityItems];
    sortedActivities.sort((a: any, b: any) => {
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
    
    for (const activity of sortedActivities) {
      const author = activity.author?.fullName || activity.author?.login || 'Unknown';
      const timestamp = activity.timestamp ? new Date(activity.timestamp) : null;
      const date = timestamp ? timestamp.toLocaleString() : 'Unknown date';
      const field = activity.field || activity.targetMember?.field?.name || 'Unknown field';
      
      let changeText = "";
      if (activity.oldValue !== undefined && activity.newValue !== undefined) {
        changeText = `Changed ${field} from "${activity.oldValue}" to "${activity.newValue}"`;
        
        // Detect when someone starts working on the issue (changed to 'in progress')
        const fieldLower = field.toLowerCase();
        const newValueLower = typeof activity.newValue === 'string' ? activity.newValue.toLowerCase() : '';
        
        if ((fieldLower === 'stage' || fieldLower === 'state') && 
            (newValueLower === 'in progress' || newValueLower === 'inprogress' || newValueLower === 'in-progress' || newValueLower === 'in work')) {
          
          // Record the person who started working on the issue
          if (timestamp && activity.author) {
            actualWorkers.push({
              user: author,
              date: timestamp
            });
            
            // Also add a special role for this person
            addContributor(activity.author, 'Actual Worker', timestamp, 'Started working on issue');
          }
        }
        
      } else if (activity.removed && activity.removed.length) {
        changeText = `Removed ${field}: "${activity.removed.join(', ')}"`;
      } else if (activity.added && activity.added.length) {
        changeText = `Added ${field}: "${activity.added.join(', ')}"`;
      } else {
        changeText = `Updated ${field}`;
      }
      
      result += `  ${author} (${date}): ${changeText}\n`;
      
      // Add activity author to contributors
      if (activity.author && timestamp) {
        addContributor(activity.author, 'Activity Contributor', timestamp, changeText);
      }
    }
    
    // Add a dedicated timeline for stage changes
    const stageChanges = sortedActivities.filter((activity: any) => {
      const field = activity.field || activity.targetMember?.field?.name || '';
      const fieldLower = field.toLowerCase();
      return (fieldLower === 'stage' || fieldLower === 'state' || fieldLower === 'status') && 
             activity.oldValue !== undefined && activity.newValue !== undefined;
    });
    
    if (stageChanges.length > 0) {
      result += '\nStage Change Timeline:\n';
      for (const change of stageChanges) {
        const author = change.author?.fullName || change.author?.login || 'Unknown';
        const timestamp = change.timestamp ? new Date(change.timestamp) : null;
        const date = timestamp ? timestamp.toLocaleString() : 'Unknown date';
        const field = change.field || change.targetMember?.field?.name || 'stage';
        const oldValue = change.oldValue || 'Unset';
        const newValue = change.newValue || 'Unknown';
        
        result += `  ${date} - ${oldValue} → ${newValue} (by ${author})\n`;
        
        // Add stage change contributor
        if (change.author && timestamp) {
          addContributor(change.author, 'Stage Manager', timestamp, `Changed ${field} to ${newValue}`);
        }
      }
    }
  }

  // Add the actual workers section if there are any
  if (actualWorkers.length > 0) {
    result += '\nActual Work Assignees:\n';
    actualWorkers.sort((a, b) => a.date.getTime() - b.date.getTime()); // Sort by date
    
    actualWorkers.forEach(worker => {
      result += `  ${worker.user} - Started working on ${worker.date.toLocaleString()}\n`;
    });
  }

  // Format comments if available
  if (issueData.comments && issueData.comments.length > 0) {
    result += '\nComments:\n';
    
    // Sort comments by creation date
    const comments = [...issueData.comments];
    comments.sort((a: any, b: any) => {
      if (!a.created) return 1;
      if (!b.created) return -1;
      return new Date(a.created).getTime() - new Date(b.created).getTime();
    });
    
    for (const comment of comments) {
      // Skip empty comments
      if (!comment.text && (!comment.attachments || comment.attachments.length === 0)) {
        continue;
      }
      
      const author = comment.author?.fullName || comment.author?.login || 'Unknown';
      const timestamp = comment.created ? new Date(comment.created) : null;
      const date = timestamp ? timestamp.toLocaleString() : 'Unknown date';
      result += `  ${author} (${date}):\n    ${comment.text || 'No text'}\n`;
      
      // Add comment author to contributors
      if (comment.author && timestamp) {
        addContributor(comment.author, 'Commenter', timestamp, 'Added comment');
      }
      
      // Add attachment references in comments
      if (comment.attachments && comment.attachments.length > 0) {
        result += `    Attachments: ${comment.attachments.map((a: any) => a.name).join(', ')}\n`;
        
        // Add attachment authors if they exist
        comment.attachments.forEach((attachment: any) => {
          if (attachment.author && attachment.created) {
            const attTimestamp = new Date(attachment.created);
            addContributor(
              attachment.author, 
              'Attachment Author', 
              attTimestamp, 
              `Added attachment to comment: ${attachment.name}`
            );
          }
        });
      }
      
      result += '\n';
    }
  }

  // Number in project
  if (issueData.numberInProject) {
    result += `Number in Project: ${issueData.numberInProject}\n`;
  }
  
  // Add the comprehensive Contributors section
  if (contributors.size > 0) {
    result += '\n========================\nIssue Contributors\n========================\n';
    
    // Convert the map to array for sorting
    const sortedContributors = Array.from(contributors.values());
    
    // Sort by number of activities (most active first)
    sortedContributors.sort((a, b) => b.activities.length - a.activities.length);
    
    // Format each contributor's information
    sortedContributors.forEach(contributor => {
      result += `${contributor.name} (${contributor.login})${contributor.email ? ` <${contributor.email}>` : ''}
  Roles: ${Array.from(contributor.roles).join(', ')}
  Total Activities: ${contributor.activities.length}
`;
      
      // Show activity timeline if there are activities
      if (contributor.activities.length > 0) {
        result += '  Activity Timeline:\n';
        
        // Sort activities by date
        const sortedActivities = [...contributor.activities];
        sortedActivities.sort((a, b) => a.date.getTime() - b.date.getTime());
        
        // Show the most recent 5 activities (or all if less than 5)
        const recentActivities = sortedActivities.slice(
          Math.max(0, sortedActivities.length - 5), 
          sortedActivities.length
        );
        
        recentActivities.forEach(activity => {
          result += `    - ${activity.date.toLocaleString()}: ${activity.action}\n`;
        });
        
        // Show count of older activities if there are more than 5
        if (sortedActivities.length > 5) {
          result += `    - Plus ${sortedActivities.length - 5} earlier activities\n`;
        }
      }
      
      result += '\n';
    });
    
    // Add a summary of contributors by role
    result += 'Contributors Summary:\n';
    
    // Collect counts by role
    const roleCounts = new Map<string, number>();
    sortedContributors.forEach(contributor => {
      contributor.roles.forEach(role => {
        const count = roleCounts.get(role) || 0;
        roleCounts.set(role, count + 1);
      });
    });
    
    // Output role counts
    Array.from(roleCounts.entries()).forEach(([role, count]) => {
      result += `  ${role}s: ${count}\n`;
    });
    
    result += `  Total Unique Contributors: ${contributors.size}\n`;
  }

  return result;
} 