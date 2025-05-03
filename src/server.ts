import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

// Import route registrations
import { registerBoardRoutes } from './routes/boardRoutes';
import { registerSprintRoutes } from './routes/sprintRoutes';
import { registerIssueRoutes } from './routes/issueRoutes';
import { registerProjectRoutes } from './routes/projectRoutes';

// Import controllers for resource handlers
import { BoardController } from './controllers/boardController';
import { SprintController } from './controllers/sprintController';
import { IssueController } from './controllers/issueController';
import { ProjectController } from './controllers/projectController';

// Import issue formatter utility
import { formatIssueForAI, formatIssuesForAI } from './utils/issue-formatter';

// Create an MCP server for YouTrack
const server = new McpServer({
  name: 'YouTrack Manager',
  version: '1.0.0',
  description: 'MCP server for managing YouTrack agile boards and tasks',
});

// Register all routes
registerBoardRoutes(server);
registerSprintRoutes(server);
registerIssueRoutes(server);
registerProjectRoutes(server);

// Resource for boards
server.resource(
  "boards",
  new ResourceTemplate("youtrack://boards/{boardId?}", { list: undefined }),
  async (uri, req) => BoardController.handleResourceRequest(uri, req)
);

// Resource for sprints
server.resource(
  "sprints",
  new ResourceTemplate("youtrack://boards/{boardId}/sprints/{sprintId?}", { list: undefined }),
  async (uri, req) => SprintController.handleResourceRequest(uri, req)
);

// Resource for issues
server.resource(
  "issues",
  new ResourceTemplate("youtrack://issues/{issueId?}", { list: undefined }),
  async (uri, req) => IssueController.handleResourceRequest(uri, req)
);

// Resource for projects
server.resource(
  "projects",
  new ResourceTemplate("youtrack://projects/{projectId?}", { list: undefined }),
  async (uri, req) => ProjectController.handleResourceRequest(uri, req)
);

// Export the server for use in the main application
export { server }; 