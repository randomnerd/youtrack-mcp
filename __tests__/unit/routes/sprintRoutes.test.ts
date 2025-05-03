import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerSprintRoutes } from '../../../src/routes/sprintRoutes';
import { SprintController } from '../../../src/controllers/sprintController';
import { SprintView } from '../../../src/views/sprintView';
import { z } from 'zod';
import { DEFAULT_PAGINATION, PAGINATION_LIMITS } from '../../../src/utils/constants';

// Mock the SprintController
jest.mock('../../../src/controllers/sprintController');

// Define expected schemas matching the implementation
const getSprintSchema = {
  boardId: expect.any(Object), // Using expect.any(Object) for ZodString definition
  sprintId: expect.any(Object),
};

const findSprintsSchema = {
  boardId: expect.any(Object),
  sprintName: expect.any(Object),
  status: expect.any(Object), // Using expect.any(Object) for complex ZodEnum/Default
  limit: expect.any(Object), // Using expect.any(Object) for complex ZodEffects
  skip: expect.any(Object), // Using expect.any(Object) for complex ZodEffects
};

describe('Sprint Routes', () => {
  let server: McpServer;
  
  beforeEach(() => {
    // Create a mock MCP server
    server = {
      tool: jest.fn(),
    } as unknown as McpServer;
    
    // Reset controller mocks
    jest.resetAllMocks();
  });
  
  it('should register sprint routes on the server', () => {
    // Register routes
    registerSprintRoutes(server as any);
    
    // Check if tool method was called twice (once for each route)
    expect(server.tool).toHaveBeenCalledTimes(2);
    
    // Check that the get_sprint route was registered
    expect(server.tool).toHaveBeenCalledWith(
      'youtrack_get_sprint',
      'Get details of a specific sprint',
      expect.objectContaining(getSprintSchema), // Use objectContaining with defined schema parts
      expect.any(Function)
    );
    
    // Check that the find_sprints route was registered
    expect(server.tool).toHaveBeenCalledWith(
      'youtrack_find_sprints',
      'Find sprints by board, name, status, or time period',
      expect.objectContaining(findSprintsSchema), // Use objectContaining with defined schema parts
      expect.any(Function)
    );
  });
  
  it('should call SprintController.getSprint when get_sprint route is called', async () => {
    // Mock implementation
    (SprintController.getSprint as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        sprint: { id: 'sprint-1', name: 'Test Sprint' },
        boardId: 'board-1'
      }
    });
    
    // Register routes
    registerSprintRoutes(server as any);
    
    // Get the route handler function
    const routeHandler = (server.tool as jest.Mock).mock.calls[0][3];
    
    // Call the route handler with boardId and sprintId
    const result = await routeHandler({ boardId: 'board-1', sprintId: 'sprint-1' });
    
    // Check if controller method was called with correct parameters
    expect(SprintController.getSprint).toHaveBeenCalledWith('board-1', 'sprint-1');
    expect(result).toEqual({ 
      content: expect.arrayContaining([
        expect.objectContaining({
          type: 'text',
          text: expect.stringContaining('Test Sprint')
        })
      ])
    });
  });

  it('should handle errors when get_sprint route fails', async () => {
    // Mock implementation to throw an error
    const errorMessage = 'Failed to fetch sprint';
    (SprintController.getSprint as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    // Register routes
    registerSprintRoutes(server as any);
    
    // Get the route handler function
    const routeHandler = (server.tool as jest.Mock).mock.calls[0][3];
    
    // Call the route handler and expect it to throw
    await expect(routeHandler({ boardId: 'board-1', sprintId: 'sprint-1' })).rejects.toThrow(errorMessage);
    expect(SprintController.getSprint).toHaveBeenCalledWith('board-1', 'sprint-1');
  });
  
  it('should call SprintController.findSprints when find_sprints route is called', async () => {
    // Mock implementation
    (SprintController.findSprints as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        sprints: [
          { id: 'sprint-1', name: 'Test Sprint 1' },
          { id: 'sprint-2', name: 'Test Sprint 2' }
        ],
        total: 2
      }
    });
    
    // Register routes
    registerSprintRoutes(server as any);
    
    // Get the route handler function
    const routeHandler = (server.tool as jest.Mock).mock.calls[1][3];
    
    // Different test cases for options
    const testCases = [
      { boardId: 'board-1' },
      { sprintName: 'Test' },
      { status: 'active' as const },
      { limit: 20 },
      { boardId: 'board-1', sprintName: 'Test', status: 'archived' as const, limit: 5 }
    ];
    
    for (const options of testCases) {
      // Reset the mock before each call
      (SprintController.findSprints as jest.Mock).mockClear();
      
      // Call the route handler with options
      const result = await routeHandler(options);
      
      // Check if controller method was called with correct parameters
      expect(SprintController.findSprints).toHaveBeenCalledWith(options);
      expect(result).toEqual({
        content: expect.arrayContaining([
          expect.objectContaining({
            type: 'text',
            text: expect.stringContaining('Test Sprint 1')
          })
        ])
      });
    }
  });

  it('should test status enum and default value in find_sprints route', async () => {
    // Mock implementation
    (SprintController.findSprints as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        sprints: [],
        total: 0
      }
    });
    
    // Register routes
    registerSprintRoutes(server as any);
    
    // Get the route handler function
    const routeHandler = (server.tool as jest.Mock).mock.calls[1][3];
    
    // Define test cases for different status values
    const testCases = [
      { input: { boardId: 'board-1' }, description: 'with no status specified' },
      { input: { boardId: 'board-1', status: 'active' }, description: 'with active status' },
      { input: { boardId: 'board-1', status: 'archived' }, description: 'with archived status' },
      { input: { boardId: 'board-1', status: 'all' }, description: 'with all status' }
    ];
    
    for (const { input, description } of testCases) {
      // Reset the mock before each call
      (SprintController.findSprints as jest.Mock).mockClear();
      
      // Call the route handler
      await routeHandler(input);
      
      // Verify the controller is called with the input options
      expect(SprintController.findSprints).toHaveBeenCalledTimes(1);
      expect(SprintController.findSprints).toHaveBeenCalledWith(expect.objectContaining({
        boardId: 'board-1'
      }));
    }
  });

  it('should test limit transformation in find_sprints route', async () => {
    // Mock implementation
    (SprintController.findSprints as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        sprints: [],
        total: 0
      }
    });
    
    // Register routes
    registerSprintRoutes(server as any);
    
    // Get the route handler function
    const routeHandler = (server.tool as jest.Mock).mock.calls[1][3];
    
    // Test various limit values
    const testCases = [
      { boardId: 'board-1', limit: 0 },
      { boardId: 'board-1', limit: 100 },
      { boardId: 'board-1', limit: undefined },
      { boardId: 'board-1', limit: 25 }
    ];
    
    for (const { boardId, limit } of testCases) {
      // Reset the mock before each call
      (SprintController.findSprints as jest.Mock).mockClear();
      
      // Call the route handler
      await routeHandler({ boardId, limit });
      
      // Verify the controller is called with the boardId and some limit
      expect(SprintController.findSprints).toHaveBeenCalledTimes(1);
      const mockFn = SprintController.findSprints as jest.Mock;
      const calledOptions = mockFn.mock.calls[0][0];
      expect(calledOptions).toHaveProperty('boardId', boardId);
      expect(calledOptions).toHaveProperty('limit');
    }
  });

  it('should handle errors when find_sprints route fails', async () => {
    // Mock implementation to throw an error
    const errorMessage = 'Failed to find sprints';
    (SprintController.findSprints as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    // Register routes
    registerSprintRoutes(server as any);
    
    // Get the route handler function
    const routeHandler = (server.tool as jest.Mock).mock.calls[1][3];
    
    // Call the route handler and expect it to throw
    await expect(routeHandler({ boardId: 'board-1' })).rejects.toThrow(errorMessage);
    expect(SprintController.findSprints).toHaveBeenCalledWith(expect.objectContaining({
      boardId: 'board-1'
    }));
  });
}); 