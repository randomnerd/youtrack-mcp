import { IssueModel } from '../models/issue';
import { McpResponse, ResourceResponse } from '../views/common';
import { extractParam, createResourceErrorResponse, withErrorHandling } from '../utils/controller-utils';
import { ControllerResult, IssueDetailResult, IssueListResult, IssueUpdateResult, Request } from '../types/controllerResults';

interface UpdateIssueOptions {
  summary?: string;
  description?: string;
  resolved?: boolean;
}

interface SearchOptions {
  limit?: number;
  sortBy?: string;
}

interface FindIssuesByCriteriaOptions {
  project?: string;
  assignee?: string;
  sprint?: string;
  type?: string;
  status?: string;
  limit?: number;
}

export class IssueController {
  static getIssue = withErrorHandling(
    async (issueId: string): Promise<ControllerResult<IssueDetailResult>> => {
      const issue = await IssueModel.getById(issueId);
      const activities = await IssueModel.getIssueActivities(issueId);
      
      if (!issue) {
        return {
          success: false,
          error: `No issue found with ID: ${issueId}`
        };
      }
      
      return {
        success: true,
        data: {
          issue,
          activities
        }
      };
    },
    'Error fetching issue details'
  );
  
  static updateIssue = withErrorHandling(
    async (issueId: string, updateData: UpdateIssueOptions): Promise<ControllerResult<IssueUpdateResult>> => {
      await IssueModel.updateIssue(issueId, updateData);
      
      return {
        success: true,
        data: {
          issueId,
          updated: true
        }
      };
    },
    'Error updating issue'
  );
  
  static searchIssues = withErrorHandling(
    async (query: string, options?: SearchOptions): Promise<ControllerResult<IssueListResult>> => {
      // Search for issues with the provided query and options
      const issues = await IssueModel.searchIssues(query || '', options);
      
      // Ensure limit is a valid number
      const safeLimit = typeof options?.limit === 'number' && options.limit > 0 ? options.limit : 10;
      
      // Limit the number of results
      const limitedIssues = issues.slice(0, safeLimit);
      
      // Create title for the list
      const title = `Found ${issues.length} issues matching query: "${query}"\nShowing ${limitedIssues.length} results.`;
      
      return {
        success: true,
        data: {
          issues: limitedIssues,
          total: issues.length,
          query,
          title
        }
      };
    },
    'Error searching issues'
  );
  
  static findIssuesByCriteria = withErrorHandling(
    async (options: FindIssuesByCriteriaOptions): Promise<ControllerResult<IssueListResult>> => {
      // Call the dedicated method for finding issues by criteria
      const issues = await IssueModel.findIssuesByCriteria(options);
      
      // Ensure limit is a valid number
      const safeLimit = typeof options.limit === 'number' && options.limit > 0 ? options.limit : 10;
      
      // Limit the number of results
      const limitedIssues = issues.slice(0, safeLimit);
      
      // Build query string for display purposes
      const queryParts: string[] = [];
      
      if (options.project) queryParts.push(`project: {${options.project}}`);
      if (options.assignee) queryParts.push(`assignee: ${options.assignee}`);
      if (options.sprint) queryParts.push(`sprint: {${options.sprint}}`);
      if (options.type) queryParts.push(`Type: {${options.type}}`);
      if (options.status) {
        if (options.status.toLowerCase() === 'resolved') {
          queryParts.push('#Resolved');
        } else if (options.status.toLowerCase() === 'unresolved') {
          queryParts.push('#Unresolved');
        } else {
          queryParts.push(`State: {${options.status}}`);
        }
      }
      
      const queryDisplay = queryParts.length > 0 ? queryParts.join(' ') : 'All issues';
      const title = `Found ${issues.length} issues matching criteria.\nUsed query: "${queryDisplay}"\nShowing ${limitedIssues.length} results.`;
      
      return {
        success: true,
        data: {
          issues: limitedIssues,
          total: issues.length,
          query: queryDisplay,
          title
        }
      };
    },
    'Error searching issues'
  );
  
  static async handleResourceRequest(uri: URL, req: Request): Promise<ResourceResponse> {
    // Extract issueId parameter
    const issueId = extractParam(req.params, 'issueId');
    
    try {
      if (issueId) {
        // Get specific issue
        const issue = await IssueModel.getById(issueId);
        
        if (!issue) {
          return {
            contents: [{
              uri: uri.href,
              text: `No issue found with ID: ${issueId}`
            }]
          };
        }
        
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify(issue, null, 2)
          }]
        };
      } else {
        return {
          contents: [{
            uri: uri.href,
            text: "Please specify an issue ID or use a sprint resource to list issues."
          }]
        };
      }
    } catch (error) {
      return createResourceErrorResponse(uri, error);
    }
  }
} 