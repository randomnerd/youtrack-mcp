import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ProjectController } from '../controllers/projectController';

export function registerProjectRoutes(server: McpServer) {
  // List projects
  server.tool(
    'youtrack_list_projects',
    'List all available projects',
    {},
    async () => {
      return await ProjectController.listProjects();
    }
  );

  // Find projects by name
  server.tool(
    'youtrack_find_projects_by_name',
    'Find projects by name',
    {
      name: {
        type: 'string',
        description: 'Project name to search for'
      }
    },
    async (params) => {
      return await ProjectController.findProjectsByName(params.name);
    }
  );
} 