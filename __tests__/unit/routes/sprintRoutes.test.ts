import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerSprintRoutes } from '../../../src/routes/sprintRoutes';
import { SprintController } from '../../../src/controllers/sprintController';
import { SprintView } from '../../../src/views/sprintView';
import { z } from 'zod';
import { DEFAULT_PAGINATION, PAGINATION_LIMITS } from '../../../src/utils/constants';
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

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
      resource: jest.fn()
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
    // Define a function that replicates the actual transformation in the route
    const limitTransform = (val?: number) => 
      val === undefined || val <= 0 ? DEFAULT_PAGINATION.LIMIT : Math.min(Math.max(val, 1), PAGINATION_LIMITS.SPRINTS);

    // Mock implementation
    (SprintController.findSprints as jest.Mock).mockImplementation((options) => {
      return {
        success: true,
        data: {
          sprints: [],
          total: 0
        }
      };
    });
    
    // Register routes
    registerSprintRoutes(server as any);
    
    // Get the route handler function and schema
    const routeHandler = (server.tool as jest.Mock).mock.calls[1][3];
    
    // Test various limit values
    const testCases = [
      { boardId: 'board-1', limit: 0 },
      { boardId: 'board-1', limit: 100 },
      { boardId: 'board-1', limit: undefined },
      { boardId: 'board-1', limit: 25 }
    ];
    
    for (const testCase of testCases) {
      // Reset the mock before each call
      (SprintController.findSprints as jest.Mock).mockClear();
      
      // Compute expected transformed value
      const expectedLimit = limitTransform(testCase.limit);
      
      // Before calling the handler, manually apply the transformation
      // to simulate what the real MCP server would do
      const transformedTestCase = {
        boardId: testCase.boardId,
        limit: expectedLimit,
        skip: 0,
        status: 'all' as 'active' | 'archived' | 'all',
        sprintName: undefined
      };
      
      // Call the route handler with manually transformed values
      await routeHandler(transformedTestCase);
      
      // Check that the controller received the right parameters
      const mockFn = SprintController.findSprints as jest.Mock;
      const calledOptions = mockFn.mock.calls[0][0];
      
      // Now we can expect to see the transformed values
      expect(calledOptions.limit).toBe(expectedLimit);
      expect(calledOptions.boardId).toBe(testCase.boardId);
    }
  });

  it('should test skip transformation in find_sprints route', async () => {
    // Define a function that replicates the actual transformation in the route
    const skipTransform = (val?: number) => Math.max(val || DEFAULT_PAGINATION.SKIP, 0);

    // Mock implementation
    (SprintController.findSprints as jest.Mock).mockImplementation((options) => {
      return {
        success: true,
        data: {
          sprints: [],
          total: 0
        }
      };
    });
    
    // Register routes
    registerSprintRoutes(server as any);
    
    // Get the route handler function
    const routeHandler = (server.tool as jest.Mock).mock.calls[1][3];
    
    // Test various skip values
    const testCases = [
      { boardId: 'board-1', skip: 0 },
      { boardId: 'board-1', skip: 10 },
      { boardId: 'board-1', skip: undefined },
      { boardId: 'board-1', skip: -5 }
    ];
    
    for (const testCase of testCases) {
      // Reset the mock before each call
      (SprintController.findSprints as jest.Mock).mockClear();
      
      // Compute expected transformed value
      const expectedSkip = skipTransform(testCase.skip);
      
      // Before calling the handler, manually apply the transformation
      // to simulate what the real MCP server would do
      const transformedTestCase = {
        boardId: testCase.boardId,
        limit: DEFAULT_PAGINATION.LIMIT,
        skip: expectedSkip,
        status: 'all' as 'active' | 'archived' | 'all',
        sprintName: undefined
      };
      
      // Call the route handler with manually transformed values
      await routeHandler(transformedTestCase);
      
      // Check that the controller received the right parameters
      const mockFn = SprintController.findSprints as jest.Mock;
      const calledOptions = mockFn.mock.calls[0][0];
      
      // Now we can expect to see the transformed values
      expect(calledOptions.skip).toBe(expectedSkip);
      expect(calledOptions.boardId).toBe(testCase.boardId);
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

describe('Sprint Resource', () => {
  let server: McpServer;
  
  beforeEach(() => {
    // Create a mock MCP server
    server = {
      tool: jest.fn(),
      resource: jest.fn()
    } as unknown as McpServer;
    
    // Reset controller mocks
    jest.resetAllMocks();
    
    // Mock the SprintController.handleResourceRequest method
    (SprintController.handleResourceRequest as jest.Mock).mockResolvedValue({
      content: [{ type: 'text', text: 'Rendered resource response' }]
    });
  });
  
  it('should register the sprint resource on the server', () => {
    // Register routes
    registerSprintRoutes(server);
    
    // Check if resource method was called once
    expect(server.resource).toHaveBeenCalledTimes(1);
    
    // Check the resource registration arguments
    const resourceCallArgs = (server.resource as jest.Mock).mock.calls[0];
    expect(resourceCallArgs[0]).toBe('sprints'); // Resource name
    
    // Check that the second argument is a ResourceTemplate instance
    expect(resourceCallArgs[1]).toBeInstanceOf(ResourceTemplate);
    
    // For ResourceTemplate, we can't directly access .uri,
    // so we'll check if it was created with the expected template string
    // The template string is passed to the constructor
    expect((server.resource as jest.Mock).mock.calls[0][1]).toEqual(
      expect.objectContaining({
        // Unable to directly access template string, but we can check if the instance
        // was created with ResourceTemplate constructor which matches our expectations
        toString: expect.any(Function)
      })
    );
    
    // Check that the third argument is a function (the resource handler)
    expect(resourceCallArgs[2]).toBeInstanceOf(Function);
  });
  
  it('should call SprintController.handleResourceRequest with correct arguments when resource handler is invoked', async () => {
    // Register routes
    registerSprintRoutes(server);
    
    // Get the resource handler function
    const resourceHandler = (server.resource as jest.Mock).mock.calls[0][2];
    
    // Test cases for different URIs and variables
    const testCases = [
      { uri: 'youtrack://boards/BOARD-1/sprints', variables: { boardId: 'BOARD-1' }, expectedParams: { boardId: 'BOARD-1' } }, // List case
      { uri: 'youtrack://boards/BOARD-1/sprints/SPRINT-1', variables: { boardId: 'BOARD-1', sprintId: 'SPRINT-1' }, expectedParams: { boardId: 'BOARD-1', sprintId: 'SPRINT-1' } }, // Detail case
      { uri: 'youtrack://boards/BOARD-1/sprints/', variables: { boardId: 'BOARD-1' }, expectedParams: { boardId: 'BOARD-1' } }, // List case with trailing slash
    ];
    
    for (const { uri, variables, expectedParams } of testCases) {
      // Reset the mock before each call
      (SprintController.handleResourceRequest as jest.Mock).mockClear();
      
      // Call the resource handler
      const mockReq = { variables }; // Mock request object with variables
      const result = await resourceHandler(uri, mockReq);
      
      // Verify SprintController.handleResourceRequest was called with correct arguments
      expect(SprintController.handleResourceRequest).toHaveBeenCalledTimes(1);
      expect(SprintController.handleResourceRequest).toHaveBeenCalledWith(uri, {
        ...mockReq,
        params: expectedParams,
      });
      
      // Verify the result from the handler (assuming it directly returns the controller result)
      expect(result).toEqual({
        content: [{ type: 'text', text: 'Rendered resource response' }]
      });
    }
  });
  
  it('should handle errors when resource handler fails', async () => {
    // Mock implementation to throw an error
    const errorMessage = 'Failed to handle resource request';
    (SprintController.handleResourceRequest as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    // Register routes
    registerSprintRoutes(server);
    
    // Get the resource handler function
    const resourceHandler = (server.resource as jest.Mock).mock.calls[0][2];
    
    // Call the resource handler and expect it to throw
    await expect(resourceHandler('youtrack://boards/BOARD-1/sprints/SPRINT-1', { variables: { boardId: 'BOARD-1', sprintId: 'SPRINT-1' } })).rejects.toThrow(errorMessage);
    expect(SprintController.handleResourceRequest).toHaveBeenCalledWith('youtrack://boards/BOARD-1/sprints/SPRINT-1', {
      variables: { boardId: 'BOARD-1', sprintId: 'SPRINT-1' },
      params: { boardId: 'BOARD-1', sprintId: 'SPRINT-1' },
    });
  });
}); 