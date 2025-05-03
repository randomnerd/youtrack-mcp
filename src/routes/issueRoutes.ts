import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { IssueController } from '../controllers/issueController';
import { IssueView } from '../views/issueView';
import { McpResponse } from '../views/common';
import { ControllerResult, IssueDetailResult, IssueUpdateResult, IssueListResult } from '../types/controllerResults';

export function registerIssueRoutes(server: McpServer) {
  // Get issue details
  server.tool(
    'youtrack_get_issue',
    'Get details of a specific issue',
    {
      issueId: z.string().describe('ID of the issue')
    },
    async ({ issueId }): Promise<McpResponse> => {
      // Call controller to get data
      const result = await IssueController.getIssue(issueId);
      
      return IssueView.renderDetail(result);
    }
  );

  // Update issue
  server.tool(
    'youtrack_update_issue',
    'Update an existing issue',
    {
      issueId: z.string().describe('ID of the issue to update'),
      summary: z.string().optional().describe('New issue summary/title'),
      description: z.string().optional().describe('New issue description'),
      resolved: z.boolean().optional().describe('Set issue as resolved')
    },
    async ({ issueId, summary, description, resolved }): Promise<McpResponse> => {
      // Call controller to update issue
      const result = await IssueController.updateIssue(issueId, {
        summary,
        description,
        resolved
      });
      
      // Pass result to view for rendering
      return IssueView.renderUpdateSuccess(result as ControllerResult<IssueUpdateResult>);
    }
  );

  // Search issues with advanced query
  server.tool(
    'youtrack_search_issues',
    'Search for issues using YouTrack query syntax',
    {
      query: z.string().describe('YouTrack search query string (e.g., \'assignee: me #Unresolved\')'),
      limit: z.number().optional().transform(val => Math.min(Math.max(val || 10, 1), 50)).describe('Maximum number of issues to return (1-50)'),
      sortBy: z.string().optional().describe('Field to sort results by (e.g., \'created\', \'updated\', \'priority\')')
    },
    async ({ query, limit, sortBy }): Promise<McpResponse> => {
      // Call controller to search issues
      const result = await IssueController.searchIssues(query, { limit, sortBy });
      
      // Pass result to view for rendering
      return IssueView.renderList(result as ControllerResult<IssueListResult>);
    }
  );

  // Search for issues by specific criteria
  server.tool(
    'youtrack_find_issues_by_criteria',
    'Find issues by specific criteria like assignee, sprint, type, or status',
    {
      project: z.string().optional().describe('Project ID or name'),
      assignee: z.string().optional().describe('Username of assignee (or \'me\' for current user)'),
      sprint: z.string().optional().describe('Sprint name'),
      type: z.string().optional().describe('Issue type (e.g., Bug, Task, Feature)'), 
      status: z.string().optional().describe('Issue status (e.g., Open, In Progress, Resolved)'),
      limit: z.number().optional().transform(val => Math.min(Math.max(val || 10, 1), 50)).describe('Maximum number of issues to return (1-50)')
    },
    async (options): Promise<McpResponse> => {
      // Call controller to find issues by criteria
      const result = await IssueController.findIssuesByCriteria(options);
      
      // Pass result to view for rendering
      return IssueView.renderList(result as ControllerResult<IssueListResult>);
    }
  );
} 