import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerProjectRoutes } from '../../../src/routes/projectRoutes';
import { ProjectController } from '../../../src/controllers/projectController';

// Mock the ProjectController
jest.mock('../../../src/controllers/projectController');

describe('Project Routes', () => {
  let server: McpServer;
  
  beforeEach(() => {
    // Create a mock MCP server
    server = {
      tool: jest.fn(),
    } as unknown as McpServer;
    
    // Reset controller mocks
    jest.resetAllMocks();
  });
  
  it('should register project routes on the server', () => {
    // Register routes
    registerProjectRoutes(server);
    
    // Check if tool method was called twice (once for each route)
    expect(server.tool).toHaveBeenCalledTimes(2);
    
    // Check that the list_projects route was registered
    expect(server.tool).toHaveBeenCalledWith(
      'youtrack_list_projects',
      'List all available projects',
      {},
      expect.any(Function)
    );
    
    // Check that the find_projects_by_name route was registered
    expect(server.tool).toHaveBeenCalledWith(
      'youtrack_find_projects_by_name',
      'Find projects by name',
      {
        name: {
          type: 'string',
          description: 'Project name to search for'
        }
      },
      expect.any(Function)
    );
  });
  
  it('should call ProjectController.listProjects when list_projects route is called', async () => {
    // Mock implementation
    (ProjectController.listProjects as jest.Mock).mockResolvedValue([
      { id: 'project-1', name: 'Test Project 1' },
      { id: 'project-2', name: 'Test Project 2' }
    ]);
    
    // Register routes
    registerProjectRoutes(server);
    
    // Get the route handler function
    const routeHandler = (server.tool as jest.Mock).mock.calls[0][3];
    
    // Call the route handler
    const result = await routeHandler();
    
    // Check if controller method was called
    expect(ProjectController.listProjects).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      { id: 'project-1', name: 'Test Project 1' },
      { id: 'project-2', name: 'Test Project 2' }
    ]);
  });
  
  it('should call ProjectController.findProjectsByName when find_projects_by_name route is called', async () => {
    // Mock implementation
    (ProjectController.findProjectsByName as jest.Mock).mockResolvedValue([
      { id: 'project-1', name: 'Test Project 1' }
    ]);
    
    // Register routes
    registerProjectRoutes(server);
    
    // Get the route handler function
    const routeHandler = (server.tool as jest.Mock).mock.calls[1][3];
    
    // Different test cases for search names
    const testCases = [
      { name: 'Test' },
      { name: 'Project' },
      { name: '' }
    ];
    
    for (const params of testCases) {
      // Reset the mock before each call
      (ProjectController.findProjectsByName as jest.Mock).mockClear();
      
      // Call the route handler with params
      const result = await routeHandler(params);
      
      // Check if controller method was called with correct parameters
      expect(ProjectController.findProjectsByName).toHaveBeenCalledWith(params.name);
      expect(result).toEqual([
        { id: 'project-1', name: 'Test Project 1' }
      ]);
    }
  });
}); 