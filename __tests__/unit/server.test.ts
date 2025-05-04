import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { server } from '../../src/server';

// Mock route registration functions
jest.mock('../../src/routes/boardRoutes', () => ({
  registerBoardRoutes: jest.fn()
}));

jest.mock('../../src/routes/sprintRoutes', () => ({
  registerSprintRoutes: jest.fn()
}));

jest.mock('../../src/routes/issueRoutes', () => ({
  registerIssueRoutes: jest.fn()
}));

jest.mock('../../src/routes/projectRoutes', () => ({
  registerProjectRoutes: jest.fn()
}));

describe('MCP Server', () => {
  it('should initialize as a valid McpServer instance', () => {
    expect(server).toBeInstanceOf(McpServer);
    // We can't access properties directly due to TypeScript definitions,
    // but we can verify the server was created successfully
    expect(server).toBeDefined();
  });

  it('should register all routes on initialization', () => {
    // Import the mocked functions to verify they were called
    const { registerBoardRoutes } = require('../../src/routes/boardRoutes');
    const { registerSprintRoutes } = require('../../src/routes/sprintRoutes');
    const { registerIssueRoutes } = require('../../src/routes/issueRoutes');
    const { registerProjectRoutes } = require('../../src/routes/projectRoutes');

    // Verify all route registration functions were called with the server instance
    expect(registerBoardRoutes).toHaveBeenCalledWith(server);
    expect(registerSprintRoutes).toHaveBeenCalledWith(server);
    expect(registerIssueRoutes).toHaveBeenCalledWith(server);
    expect(registerProjectRoutes).toHaveBeenCalledWith(server);
  });
}); 