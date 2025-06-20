import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ProjectController } from '../controllers/projectController';
import { ProjectView } from '../views/projectView';
import { McpResponse } from '../views/common';
import { PAGINATION_LIMITS, DEFAULT_PAGINATION } from '../utils/constants';
import { Request } from '../types/controllerResults';

export function registerProjectRoutes(server: McpServer) {
  // List projects
  server.tool(
    'youtrack_list_projects',
    'List all available projects',
    {
      limit: z.number().optional().transform(val => 
        val === undefined || val <= 0 ? DEFAULT_PAGINATION.LIMIT : Math.min(Math.max(val, 1), PAGINATION_LIMITS.PROJECTS)
      ).describe(`Maximum number of projects to return (1-${PAGINATION_LIMITS.PROJECTS})`),
      skip: z.number().optional().transform(val => 
        Math.max(val || DEFAULT_PAGINATION.SKIP, 0)
      ).describe('Number of projects to skip (for pagination)')
    },
    async ({ limit, skip }): Promise<McpResponse> => {
      // Call controller to get data
      const result = await ProjectController.listProjects({ limit, skip });
      
      // Pass result to view for rendering
      return ProjectView.renderList(result);
    }
  );

  // Find projects by name
  server.tool(
    'youtrack_find_projects_by_name',
    'Find projects by name',
    {
      name: z.string().describe('Project name to search for'),
      limit: z.number().optional().transform(val => 
        val === undefined || val <= 0 ? DEFAULT_PAGINATION.LIMIT : Math.min(Math.max(val, 1), PAGINATION_LIMITS.PROJECTS)
      ).describe(`Maximum number of projects to return (1-${PAGINATION_LIMITS.PROJECTS})`),
      skip: z.number().optional().transform(val => 
        Math.max(val || DEFAULT_PAGINATION.SKIP, 0)
      ).describe('Number of projects to skip (for pagination)')
    },
    async ({ name, limit, skip }): Promise<McpResponse> => {
      // Call controller to find projects
      const result = await ProjectController.findProjectsByName(name, { limit, skip });
      
      // Pass result to view for rendering
      return ProjectView.renderList(result);
    }
  );

  server.resource(
    "projects",
    new ResourceTemplate("youtrack://projects/{projectId?}", { list: undefined }),
    async (uri, req) => ProjectController.handleResourceRequest(uri, {
      ...req,
      params: req.variables || {},
    } as Request)
  );
} 