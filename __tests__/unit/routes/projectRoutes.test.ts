import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerProjectRoutes } from '../../../src/routes/projectRoutes';
import { ProjectController } from '../../../src/controllers/projectController';
import { ProjectView } from '../../../src/views/projectView';
import { createProjectListResult, createProjectDetailResult, createErrorResult } from '../../helpers/testHelpers';

// Mock the ProjectController and ProjectView
jest.mock('../../../src/controllers/projectController');
jest.mock('../../../src/views/projectView');

describe('Project Routes', () => {
  // Create a mock server
  const server = {
    tool: jest.fn(),
    resource: jest.fn()
  } as unknown as McpServer;
  
  beforeEach(() => {
    // Clear all mocks
    jest.resetAllMocks();
    
    // Mock the ProjectView methods
    (ProjectView.renderList as jest.Mock).mockReturnValue({
      content: [{ type: 'text', text: 'Rendered project list' }]
    });
    
    (ProjectView.renderDetail as jest.Mock).mockReturnValue({
      content: [{ type: 'text', text: 'Rendered project detail' }]
    });
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
      expect.any(Object),
      expect.any(Function)
    );
    
    // Check that the find_projects_by_name route was registered
    expect(server.tool).toHaveBeenCalledWith(
      'youtrack_find_projects_by_name',
      'Find projects by name',
      expect.objectContaining({
        name: expect.any(Object)
      }),
      expect.any(Function)
    );
  });
  
  it('should call ProjectController.listProjects when list_projects route is called', async () => {
    // Mock implementation
    const projects = [
      { id: 'project-1', name: 'Test Project 1' },
      { id: 'project-2', name: 'Test Project 2' }
    ];
    const controllerResult = createProjectListResult(projects as any);
    (ProjectController.listProjects as jest.Mock).mockResolvedValue(controllerResult);
    
    // Register routes
    registerProjectRoutes(server);
    
    // Get the route handler function
    const routeHandler = (server.tool as jest.Mock).mock.calls[0][3];
    
    // Call the route handler
    const result = await routeHandler({});
    
    // Check if controller method was called
    expect(ProjectController.listProjects).toHaveBeenCalledTimes(1);
    expect(ProjectView.renderList).toHaveBeenCalledWith(controllerResult);
    expect(result).toEqual({
      content: [{ type: 'text', text: 'Rendered project list' }]
    });
  });
  
  it('should call ProjectController.findProjectsByName when find_projects_by_name route is called', async () => {
    // Mock implementation
    const projects = [{ id: 'project-1', name: 'Test Project 1' }];
    const controllerResult = createProjectListResult(projects as any);
    (ProjectController.findProjectsByName as jest.Mock).mockResolvedValue(controllerResult);
    
    // Register routes
    registerProjectRoutes(server);
    
    // Get the route handler function
    const routeHandler = (server.tool as jest.Mock).mock.calls[1][3];
    
    // Different test cases for parameters
    const testCases = [
      { name: 'Test' },
      { name: 'Project' }
    ];
    
    for (const params of testCases) {
      // Reset mocks
      (ProjectController.findProjectsByName as jest.Mock).mockClear();
      (ProjectView.renderList as jest.Mock).mockClear();
      
      // Call the route handler with params
      const result = await routeHandler(params);
      
      // Check if controller method was called with correct parameters
      expect(ProjectController.findProjectsByName).toHaveBeenCalledWith(params.name, { limit: undefined, skip: undefined });
      expect(ProjectView.renderList).toHaveBeenCalledWith(controllerResult);
      expect(result).toEqual({
        content: [{ type: 'text', text: 'Rendered project list' }]
      });
    }
  });
}); 