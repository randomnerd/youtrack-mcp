import * as YouTrackTypes from '../types/youtrack';
import { CommonView, McpResponse, ResourceResponse } from './common';
import { formatIssueForAI, formatIssuesForAI } from '../utils/issue-formatter';
import { formatSprintListItem, formatSprintPeriod, formatIssueStatus, createSeparator } from '../utils/view-utils';

export class SprintView {
  static renderDetail(sprint: YouTrackTypes.Sprint, boardId: string, issues: (YouTrackTypes.Issue | YouTrackTypes.IssueRef)[] = []): McpResponse {
    // Sprint summary for the overview
    const sprintSummary = {
      type: 'text' as const,
      text: `Summary: Sprint "${sprint.name}" (ID: ${sprint.id})`
    };

    // Sprint details
    const sprintDetails = {
      type: 'text' as const,
      text: `Sprint Details:
Name: ${sprint.name} (ID: ${sprint.id})
Board ID: ${boardId}
Period: ${formatSprintPeriod(sprint)}
Issue Count: ${issues.length || 0}
`
    };

    // If no issues found, return only sprint details
    if (!issues || issues.length === 0) {
      return {
        content: [
          sprintSummary,
          sprintDetails,
          {
            type: 'text' as const,
            text: 'No issues found in this sprint.'
          }
        ],
      };
    }

    // Format the issues using the new formatter
    // Filter for full Issue objects (not just refs)
    const fullIssues = issues.filter((issue): issue is YouTrackTypes.Issue => 
      'summary' in issue && 'idReadable' in issue && 'numberInProject' in issue
    );
    
    let issuesContent;
    
    if (fullIssues.length === issues.length) {
      // If all issues are full issues, use the batch formatter
      issuesContent = {
        type: 'text' as const,
        text: formatIssuesForAI(fullIssues)
      };
    } else {
      // If we only have issue references or incomplete issues, format them simply
      issuesContent = {
        type: 'text' as const,
        text: issues.map(issue => 
          `Issue ID: ${issue.id}${('summary' in issue) ? ` - ${issue.summary}` : ''}`
        ).join('\n\n')
      };
    }

    // Return complete response with sprint summary, details and all formatted issues
    return {
      content: [
        sprintSummary,
        sprintDetails,
        issuesContent
      ],
    };
  }

  static renderList(sprints: YouTrackTypes.Sprint[], boardName?: string): McpResponse {
    const sprintsText = sprints.map(sprint => formatSprintListItem(sprint)).join('\n\n');
    
    const title = boardName 
      ? `Sprints for board "${boardName}"` 
      : `Found ${sprints.length} sprints`;
    
    return {
      content: [{ 
        type: "text" as const, 
        text: `${title}:\n\n${sprintsText}` 
      }]
    };
  }

  static renderEmpty = CommonView.renderEmpty;
  static renderError = CommonView.renderError;

  static handleResourceRequest(uri: URL, params: any, sprint?: YouTrackTypes.Sprint | YouTrackTypes.Sprint[], board?: YouTrackTypes.Board): ResourceResponse {
    const boardId = params?.boardId || 'unknown';
    
    if (!sprint) {
      return CommonView.createResourceResponse(uri, "No sprint data available");
    }
    
    if (Array.isArray(sprint)) {
      // List of sprints
      const sprintsText = sprint.map(s => formatSprintListItem(s)).join('\n\n');
      
      return CommonView.createResourceResponse(uri, `Sprints for board "${board?.name || boardId}":\n\n${sprintsText}`);
    } else {
      // Single sprint
      const issuesText = sprint.issues && sprint.issues.length > 0
        ? sprint.issues.map(issue => 
            `  - ${('summary' in issue) ? issue.summary : `Issue ${issue.id}`} (ID: ${issue.id})\n    Status: ${formatIssueStatus(issue)}`
          ).join('\n')
        : '  No issues found';
      
      return CommonView.createResourceResponse(uri, `Sprint: ${sprint.name} (ID: ${sprint.id})\nBoard: ${boardId}\nPeriod: ${formatSprintPeriod(sprint)}\n\nIssues:\n${issuesText}`);
    }
  }
} 