import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { IssueController } from '../controllers/issueController';

export function registerIssueRoutes(server: McpServer) {
  // Get issue details
  server.tool(
    'youtrack_get_issue',
    'Get details of a specific issue',
    {
      issueId: z.string().describe('ID of the issue')
    },
    async ({ issueId }) => {
      return await IssueController.getIssue(issueId);
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
    async ({ issueId, summary, description, resolved }) => {
      return await IssueController.updateIssue(issueId, {
        summary,
        description,
        resolved
      });
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
    async ({ query, limit, sortBy }) => {
      return await IssueController.searchIssues(query, { limit, sortBy });
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
    async (options) => {
      return await IssueController.findIssuesByCriteria(options);
    }
  );
} 