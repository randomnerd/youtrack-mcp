import * as YouTrackTypes from '../types/youtrack';
import { CommonView, McpResponse, ResourceResponse } from './common';
import { mapIssueToAIReadableText } from '../utils/issue-mapper';
import { formatSprintListItem, formatSprintPeriod, formatIssueStatus, createSeparator } from '../utils/view-utils';

export class SprintView {
  static renderDetail(sprint: YouTrackTypes.Sprint, boardId: string, issues: YouTrackTypes.Issue[] = []): McpResponse {
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

    // Process each issue and format with the mapIssueToAIReadableText function
    const issueContents = issues.map((issue, index) => {
      try {
        return {
          type: 'text' as const,
          text: `--- Issue ${index + 1} of ${issues.length} ---\n${mapIssueToAIReadableText(issue)}\n${createSeparator()}`
        };
      } catch (error) {
        return {
          type: 'text' as const,
          text: `--- Issue ${index + 1} of ${issues.length} ---\nError processing issue ${issue.id}: ${issue.summary || 'No summary'}\n${createSeparator()}`
        };
      }
    });

    // Return complete response with sprint summary, details and all formatted issues
    return {
      content: [
        sprintSummary,
        sprintDetails,
        ...issueContents
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
            `  - ${issue.summary} (ID: ${issue.id})\n    Status: ${formatIssueStatus(issue)}`
          ).join('\n')
        : '  No issues found';
      
      return CommonView.createResourceResponse(uri, `Sprint: ${sprint.name} (ID: ${sprint.id})\nBoard: ${boardId}\nPeriod: ${formatSprintPeriod(sprint)}\n\nIssues:\n${issuesText}`);
    }
  }
} 