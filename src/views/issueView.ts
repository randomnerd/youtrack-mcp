import * as YouTrackTypes from '../types/youtrack';
import { CommonView, McpResponse, ResourceResponse } from './common';
import { formatIssueForAI, formatIssuesForAI } from '../utils/issue-formatter';
import { createSeparator } from '../utils/view-utils';
import { ControllerResult, IssueDetailResult, IssueListResult, IssueUpdateResult } from '../types/controllerResults';
import { formatYouTrackData } from '../utils/youtrack-json-formatter';

export class IssueView {
  static renderDetail(result: ControllerResult<IssueDetailResult>, json = true): McpResponse {
    if (!result.success || !result.data) {
      return this.renderError(result.error || 'Failed to fetch issue details');
    }
    
    const { issue, activities } = result.data;
    const data = activities ? {...issue, activities} : issue;
    
    return {
      content: [{ 
        type: "text", 
        text: json ? formatYouTrackData(data, { stringify: true }) : formatIssueForAI(data), 
      }]
    };
  }
  
  static renderList(result: ControllerResult<IssueListResult>, json = true): McpResponse {
    if (!result.success || !result.data) {
      return this.renderError(result.error || 'Failed to fetch issues');
    }
    
    const { issues, title } = result.data;
    
    if (issues.length === 0) {
      return this.renderEmpty('No issues found matching the criteria.');
    }
    
    try {
      // Format all issues together using the new formatter
      const data = json ? formatYouTrackData(issues, { stringify: true }) : formatIssuesForAI(issues);
      
      return {
        content: [
          { type: "text" as const, text: data }
        ]
      };
    } catch (error) {
      // Handle formatting errors
      return {
        content: [
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
      return CommonView.createResourceResponse(uri, formatYouTrackData(issue, { stringify: true }));
    } catch (error) {
      return CommonView.createResourceResponse(uri, `Error processing issue: ${(error as Error).message}`);
    }
  }
} 