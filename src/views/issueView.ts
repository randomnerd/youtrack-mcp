import * as YouTrackTypes from '../types/youtrack';
import { CommonView, McpResponse, ResourceResponse } from './common';
import { formatIssueForAI, formatIssuesForAI } from '../utils/issue-formatter';
import { createSeparator } from '../utils/view-utils';

export class IssueView {
  static renderDetail(issue: YouTrackTypes.Issue, activities?: any[]): McpResponse {
    return {
      content: [{ 
        type: "text", 
        text: formatIssueForAI(activities ? {...issue, activities} : issue), 
      }]
    };
  }
  
  static renderList(issues: YouTrackTypes.Issue[], title: string): McpResponse {
    if (issues.length === 0) {
      return this.renderEmpty('No issues found matching the criteria.');
    }
    
    // Provide a summary
    const summaryContent = {
      type: "text" as const,
      text: title
    };
    
    // Format all issues together using the new formatter
    const formattedIssues = formatIssuesForAI(issues);
    
    return {
      content: [
        summaryContent, 
        { type: "text" as const, text: formattedIssues }
      ]
    };
  }
  
  static renderUpdateSuccess(issueId: string): McpResponse {
    return {
      content: [{ 
        type: "text", 
        text: `Issue ${issueId} updated successfully!` 
      }]
    };
  }

  static renderEmpty = CommonView.renderEmpty;
  static renderError = CommonView.renderError;

  static handleResourceRequest(uri: URL, issue?: YouTrackTypes.Issue): ResourceResponse {
    if (!issue) {
      return CommonView.createResourceResponse(uri, "Please specify an issue ID or use a sprint resource to list issues.");
    }
    
    return CommonView.createResourceResponse(uri, formatIssueForAI(issue));
  }
} 