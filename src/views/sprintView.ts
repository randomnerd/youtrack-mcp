import * as YouTrackTypes from '../types/youtrack';
import { CommonView, McpResponse, ResourceResponse } from './common';
import { formatIssueForAI, formatIssuesForAI } from '../utils/issue-formatter';
import { formatSprintListItem, formatSprintPeriod, formatIssueStatus, createSeparator } from '../utils/view-utils';
import { Request, type ControllerResult, type SprintDetailResult, type SprintListResult } from '../types/controllerResults';

export class SprintView {
  static renderDetail(result: ControllerResult<SprintDetailResult>): McpResponse {
    if (!result.success || !result.data) {
      return this.renderError(result.error || 'Failed to fetch sprint details');
    }

    const { sprint, boardId } = result.data;
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
Issue Count: ${sprint.issues?.length || 0}
`
    };

    // If no issues found, return only sprint details
    if (!sprint.issues || sprint.issues.length === 0) {
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
    const fullIssues = sprint.issues.filter((issue): issue is YouTrackTypes.Issue => 
      'summary' in issue && 'idReadable' in issue && 'numberInProject' in issue
    );
    
    let issuesContent;
    
    if (fullIssues.length === sprint.issues.length) {
      // If all issues are full issues, use the batch formatter
      issuesContent = {
        type: 'text' as const,
        text: formatIssuesForAI(fullIssues)
      };
    } else {
      // If we only have issue references or incomplete issues, format them simply
      issuesContent = {
        type: 'text' as const,
        text: sprint.issues.map(issue => 
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

  static renderList(result: ControllerResult<SprintListResult>, boardName?: string): McpResponse {
    if (!result.success || !result.data) {
      return this.renderError(result.error || 'Failed to fetch sprints');
    }

    const sprintsText = result.data.sprints.map(sprint => formatSprintListItem(sprint)).join('\n\n');
    
    const title = boardName 
      ? `Sprints for board "${boardName}"` 
      : `Found ${result.data.total} sprints`;
    
    return {
      content: [{ 
        type: "text" as const, 
        text: `${title}:\n\n${sprintsText}` 
      }]
    };
  }

  static renderEmpty = CommonView.renderEmpty;
  static renderError = CommonView.renderError;

  static handleResourceRequest(uri: URL, params: Record<string, string | undefined>, sprint?: YouTrackTypes.Sprint | YouTrackTypes.Sprint[], board?: YouTrackTypes.Board): ResourceResponse {
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