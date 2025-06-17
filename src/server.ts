import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Import route registrations
import { registerBoardRoutes } from './routes/boardRoutes';
import { registerSprintRoutes } from './routes/sprintRoutes';
import { registerIssueRoutes } from './routes/issueRoutes';
import { registerProjectRoutes } from './routes/projectRoutes';
import { registerArticleRoutes } from './routes/articleRoutes';

// Create an MCP server for YouTrack
const server = new McpServer({
  name: 'YouTrack Manager',
  version: '1.0.0',
  description: 'MCP server for managing YouTrack agile boards and tasks',
  capabilities: {
    prompts: {},
  },
});

// Register all routes
registerBoardRoutes(server);
registerSprintRoutes(server);
registerIssueRoutes(server);
registerProjectRoutes(server);
registerArticleRoutes(server);

export { server }; 