import { IssueModel } from '../models/issue';
import { McpResponse, ResourceResponse } from '../views/common';
import { extractParam, createResourceErrorResponse, withErrorHandling } from '../utils/controller-utils';
import { ControllerResult, IssueDetailResult, IssueListResult, IssueUpdateResult, Request } from '../types/controllerResults';
import { PAGINATION_LIMITS, DEFAULT_PAGINATION } from '../utils/constants';

interface UpdateIssueOptions {
  summary?: string;
  description?: string;
  resolved?: boolean;
}

interface SearchOptions {
  limit?: number;
  skip?: number;
  sortBy?: string;
}

interface FindIssuesByCriteriaOptions {
  project?: string;
  assignee?: string;
  sprint?: string;
  type?: string;
  status?: string;
  limit?: number;
  skip?: number;
}

interface GetActivitiesOptions {
  limit?: number;
  skip?: number;
  categories?: string;
  reverse?: boolean;
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
  
  static getIssueComments = withErrorHandling(
    async (issueId: string, options?: { limit?: number; skip?: number }): Promise<ControllerResult<any>> => {
      const comments = await IssueModel.getIssueComments(issueId, options);
      
      return {
        success: true,
        data: {
          comments,
          total: comments.length,
          issueId
        }
      };
    },
    'Error fetching issue comments'
  );
  
  static getIssueAttachments = withErrorHandling(
    async (issueId: string, options?: { limit?: number; skip?: number }): Promise<ControllerResult<any>> => {
      const attachments = await IssueModel.getIssueAttachments(issueId, options);
      
      return {
        success: true,
        data: {
          attachments,
          total: attachments.length,
          issueId
        }
      };
    },
    'Error fetching issue attachments'
  );
  
  static getIssueLinks = withErrorHandling(
    async (issueId: string, options?: { limit?: number; skip?: number }): Promise<ControllerResult<any>> => {
      const links = await IssueModel.getIssueLinks(issueId, options);
      
      return {
        success: true,
        data: {
          links,
          total: links.length,
          issueId
        }
      };
    },
    'Error fetching issue links'
  );
  
  static getIssueActivities = withErrorHandling(
    async (issueId: string, options?: GetActivitiesOptions): Promise<ControllerResult<any>> => {
      const activities = await IssueModel.getIssueActivities(issueId, options);
      
      return {
        success: true,
        data: {
          activities,
          total: activities.length,
          issueId
        }
      };
    },
    'Error fetching issue activities'
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
      
      // Create title for the list
      const title = `Found ${issues.length} issues matching query: "${query}"${options?.limit ? `\nShowing ${Math.min(issues.length, options.limit)} results starting from ${options.skip || 0}.` : ''}`;
      
      return {
        success: true,
        data: {
          issues,
          total: issues.length,
          query,
          title,
          pagination: {
            limit: options?.limit,
            skip: options?.skip || 0
          }
        }
      };
    },
    'Error searching issues'
  );
  
  static findIssuesByCriteria = withErrorHandling(
    async (options: FindIssuesByCriteriaOptions): Promise<ControllerResult<IssueListResult>> => {
      // Call the dedicated method for finding issues by criteria
      const issues = await IssueModel.findIssuesByCriteria(options);
      
      // Build query string for display purposes
      const queryParts: string[] = [];
      
      if (options.project) queryParts.push(`project: {${options.project}}`);
      if (options.assignee) {
        if (options.assignee.toLowerCase() === 'me') {
          queryParts.push('for: me');
        } else {
          queryParts.push(`for: ${options.assignee}`);
        }
      }
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
      const title = `Found ${issues.length} issues matching criteria.\nUsed query: "${queryDisplay}"${options?.limit ? `\nShowing ${Math.min(issues.length, options.limit)} results starting from ${options.skip || 0}.` : ''}`;
      
      return {
        success: true,
        data: {
          issues,
          total: issues.length,
          query: queryDisplay,
          title,
          pagination: {
            limit: options?.limit,
            skip: options?.skip || 0
          }
        }
      };
    },
    'Error searching issues'
  );
  
  static async handleResourceRequest(uri: URL, req: Request): Promise<ResourceResponse> {
    // Extract issueId parameter
    const issueId = extractParam(req.params, 'issueId');
    const limit = req.query && typeof req.query.limit === 'string' ? 
      Math.min(Number(req.query.limit), PAGINATION_LIMITS.ISSUES) : DEFAULT_PAGINATION.LIMIT;
    const skip = req.query && typeof req.query.skip === 'string' ? 
      Number(req.query.skip) : DEFAULT_PAGINATION.SKIP;
    
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