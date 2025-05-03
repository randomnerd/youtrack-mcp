import * as YouTrackTypes from '../types/youtrack';
import { CommonView, McpResponse, ResourceResponse } from './common';
import { mapIssueToAIReadableText } from '../utils/issue-mapper';
import { createSeparator } from '../utils/view-utils';

export class IssueView {
  static renderDetail(issue: YouTrackTypes.Issue, activities?: any[]): McpResponse {
    return {
      content: [{ 
        type: "text", 
        text: mapIssueToAIReadableText(issue, activities), 
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
    
    // Create content entries for each issue
    const issueContents = issues.map((issue, index) => {
      try {
        return {
          type: "text" as const,
          text: `--- Issue ${index + 1} of ${issues.length} ---\n${mapIssueToAIReadableText(issue)}\n${createSeparator()}`
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          type: "text" as const,
          text: `--- Issue ${index + 1} of ${issues.length} ---\nError processing issue ${issue.id || 'unknown'}: ${issue.summary || 'No summary'}\nError: ${errorMessage}\n${createSeparator()}`
        };
      }
    });
    
    return {
      content: [summaryContent, ...issueContents]
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
    
    return CommonView.createResourceResponse(uri, mapIssueToAIReadableText(issue));
  }
} 