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
} 