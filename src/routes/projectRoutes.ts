import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ProjectController } from '../controllers/projectController';
import { ProjectView } from '../views/projectView';
import { McpResponse } from '../views/common';
import { ControllerResult, ProjectListResult } from '../types/controllerResults';

export function registerProjectRoutes(server: McpServer) {
  // List projects
  server.tool(
    'youtrack_list_projects',
    'List all available projects',
    {},
    async (): Promise<McpResponse> => {
      // Call controller to get data
      const result = await ProjectController.listProjects();
      
      // Pass result to view for rendering
      return ProjectView.renderList(result);
    }
  );

  // Find projects by name
  server.tool(
    'youtrack_find_projects_by_name',
    'Find projects by name',
    {
      name: z.string().describe('Project name to search for')
    },
    async (params): Promise<McpResponse> => {
      // Call controller to find projects
      const result = await ProjectController.findProjectsByName(params.name);
      
      // Pass result to view for rendering
      return ProjectView.renderList(result);
    }
  );
} 