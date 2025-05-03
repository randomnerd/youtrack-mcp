import * as YouTrackTypes from '../types/youtrack';
import { CommonView, McpResponse, ResourceResponse } from './common';
import { formatIssueForAI, formatIssuesForAI } from '../utils/issue-formatter';
import { createSeparator } from '../utils/view-utils';
import { ControllerResult, IssueDetailResult, IssueListResult, IssueUpdateResult } from '../types/controllerResults';

export class IssueView {
  static renderDetail(result: ControllerResult<IssueDetailResult>): McpResponse {
    if (!result.success || !result.data) {
      return this.renderError(result.error || 'Failed to fetch issue details');
    }
    
    const { issue, activities } = result.data;
    
    return {
      content: [{ 
        type: "text", 
        text: formatIssueForAI(activities ? {...issue, activities} : issue), 
      }]
    };
  }
  
  static renderList(result: ControllerResult<IssueListResult>): McpResponse {
    if (!result.success || !result.data) {
      return this.renderError(result.error || 'Failed to fetch issues');
    }
    
    const { issues, title } = result.data;
    
    if (issues.length === 0) {
      return this.renderEmpty('No issues found matching the criteria.');
    }
    
    // Provide a summary
    const summaryContent = {
      type: "text" as const,
      text: title || `Found ${issues.length} issues`
    };
    
    try {
      // Format all issues together using the new formatter
      const formattedIssues = formatIssuesForAI(issues);
      
      return {
        content: [
          summaryContent, 
          { type: "text" as const, text: formattedIssues }
        ]
      };
    } catch (error) {
      // Handle formatting errors
      return {
        content: [
          summaryContent,
          { 
            type: "text" as const, 
            text: `Error processing issue: ${(error as Error).message}`
          }
        ]
      };
    }
  }
  
  static renderUpdateSuccess(result: ControllerResult<IssueUpdateResult>): McpResponse {
    if (!result.success || !result.data) {
      return this.renderError(result.error || 'Failed to update issue');
    }
    
    return {
      content: [{ 
        type: "text", 
        text: `Issue ${result.data.issueId} updated successfully!` 
      }]
    };
  }

  static renderEmpty = CommonView.renderEmpty;
  static renderError = CommonView.renderError;

  static handleResourceRequest(uri: URL, issue?: YouTrackTypes.Issue): ResourceResponse {
    if (!issue) {
      return CommonView.createResourceResponse(uri, "Please specify an issue ID or use a sprint resource to list issues.");
    }
    
    try {
      return CommonView.createResourceResponse(uri, formatIssueForAI(issue));
    } catch (error) {
      return CommonView.createResourceResponse(uri, `Error processing issue: ${(error as Error).message}`);
    }
  }
} 