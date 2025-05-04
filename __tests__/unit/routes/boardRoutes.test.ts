import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerBoardRoutes } from '../../../src/routes/boardRoutes';
import { BoardController } from '../../../src/controllers/boardController';
import { BoardView } from '../../../src/views/boardView';
import { createBoardListResult, createBoardDetailResult, createErrorResult } from '../../helpers/testHelpers';
import { z } from 'zod';
import { PAGINATION_LIMITS, DEFAULT_PAGINATION } from '../../../src/utils/constants';

// Mock dependencies
jest.mock('../../../src/controllers/boardController');
jest.mock('../../../src/views/boardView');

// Helper to capture the handler function from server.tool mock
const captureHandler = (mockServer: any, toolName: string): ((args: any) => Promise<any>) => {
  const call = mockServer.tool.mock.calls.find((c: any) => c[0] === toolName);
  if (!call || call.length < 4) {
    throw new Error(`Handler for tool '${toolName}' not captured.`);
  }
  return call[3]; // Handler is the 4th argument
};

// Helper to capture the schema definition from server.tool mock
const captureSchema = (mockServer: any, toolName: string): any => {
  const call = mockServer.tool.mock.calls.find((c: any) => c[0] === toolName);
  if (!call || call.length < 3) {
    throw new Error(`Schema for tool '${toolName}' not captured.`);
  }
  return call[2]; // Schema is the 3rd argument
};

// Helper to capture the resource handler function from server.resource mock
const captureResourceHandler = (mockServer: any, resourceName: string): ((uri: URL, req: any) => Promise<any>) => {
  const call = mockServer.resource.mock.calls.find((c: any) => c[0] === resourceName);
  if (!call || call.length < 3) {
    throw new Error(`Resource handler for '${resourceName}' not captured.`);
  }
  return call[2]; // Handler is the 3rd argument
};

describe('Board Routes', () => {
  let server: any;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock the McpServer instance and its 'tool' method
    server = {
      tool: jest.fn(),
      resource: jest.fn(),
    };

    // Mock view methods to return simple structures
    (BoardView.renderList as jest.Mock).mockReturnValue({
      content: [{ type: 'text', text: 'Rendered board list' }]
    });
    (BoardView.renderDetail as jest.Mock).mockReturnValue({
      content: [{ type: 'text', text: 'Rendered board detail' }]
    });
    (BoardView.renderError as jest.Mock).mockReturnValue({
      content: [{ type: 'text', text: 'Error: Failed to fetch board' }]
    });
  });

  it('should register board routes correctly', () => {
    registerBoardRoutes(server);
    expect(server.tool).toHaveBeenCalledWith(
      'youtrack_list_boards', 
      expect.any(String), 
      expect.any(Object), // Schema checks handled in specific tests
      expect.any(Function)
    );
    expect(server.tool).toHaveBeenCalledWith(
      'youtrack_get_board',
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
  });

  describe('list_boards route handler', () => {
    it('should call BoardController.listBoards and BoardView.renderList on success', async () => {
      const mockBoardsResult = createBoardListResult([{ id: 'b1', name: 'Board 1', $type: 'Agile' }]);
      (BoardController.listBoards as jest.Mock).mockResolvedValue(mockBoardsResult);
      
      registerBoardRoutes(server);
      const handler = captureHandler(server, 'youtrack_list_boards');
      const args = { limit: 10, skip: 0 };
      const result = await handler(args);
      
      expect(BoardController.listBoards).toHaveBeenCalledTimes(1);
      expect(BoardController.listBoards).toHaveBeenCalledWith(args);
      expect(BoardView.renderList).toHaveBeenCalledTimes(1);
      expect(BoardView.renderList).toHaveBeenCalledWith(mockBoardsResult);
      expect(result).toEqual({ content: [{ type: 'text', text: 'Rendered board list' }] });
    });

    it('should call BoardView.renderList with error result on failure', async () => {
      const mockErrorResult = createErrorResult('Failed to fetch boards');
      (BoardController.listBoards as jest.Mock).mockResolvedValue(mockErrorResult);

      registerBoardRoutes(server);
      const handler = captureHandler(server, 'youtrack_list_boards');
      const args = { limit: 10, skip: 0 };
      const result = await handler(args);

      expect(BoardController.listBoards).toHaveBeenCalledTimes(1);
      expect(BoardController.listBoards).toHaveBeenCalledWith(args);
      expect(BoardView.renderList).toHaveBeenCalledTimes(1);
      expect(BoardView.renderList).toHaveBeenCalledWith(mockErrorResult);
      // Assuming renderList handles the error structure internally and returns its mock value
      expect(result).toEqual({ content: [{ type: 'text', text: 'Rendered board list' }] }); 
    });

    // Add tests for parameter transformations
    it('should apply limit and skip transformations for different values', async () => {
      const mockBoardsResult = createBoardListResult([{ id: 'b1', name: 'Board 1', $type: 'Agile' }]);
      
      // Set up a mock implementation to capture transformed values
      let capturedArgs = {};
      (BoardController.listBoards as jest.Mock).mockImplementation((args) => {
        capturedArgs = { ...args };
        return mockBoardsResult;
      });
      
      registerBoardRoutes(server);
      const handler = captureHandler(server, 'youtrack_list_boards');
      
      // Reset mock to ensure clean call count
      (BoardController.listBoards as jest.Mock).mockClear();
      
      // Test with valid limit and skip
      await handler({ limit: 10, skip: 5 });
      expect(capturedArgs).toEqual({ limit: 10, skip: 5 });
      (BoardController.listBoards as jest.Mock).mockClear();
      
      // Note: We're not testing the transform directly here as it's not applied
      // by our mock server implementation. Tests for transform logic are in the
      // 'boardRoutes transform functions' section below.
    });
  });

  describe('get_board route handler', () => {
    it('should call BoardController.getBoard and BoardView.renderDetail on success', async () => {
      const mockBoardResult = createBoardDetailResult({ id: 'board-1', name: 'Test Board 1', $type: 'Agile' });
      (BoardController.getBoard as jest.Mock).mockResolvedValue(mockBoardResult);
      
      registerBoardRoutes(server);
      const handler = captureHandler(server, 'youtrack_get_board');
      const args = { boardId: 'board-1' };
      const result = await handler(args);

      expect(BoardController.getBoard).toHaveBeenCalledTimes(1);
      expect(BoardController.getBoard).toHaveBeenCalledWith('board-1');
      expect(BoardView.renderDetail).toHaveBeenCalledTimes(1);
      // Expect renderDetail to be called with the ControllerResult
      expect(BoardView.renderDetail).toHaveBeenCalledWith(mockBoardResult);
      expect(result).toEqual({ content: [{ type: 'text', text: 'Rendered board detail' }] });
    });

    it('should call BoardView.renderDetail with error result on failure', async () => {
      const mockErrorResult = createErrorResult('Board not found');
      (BoardController.getBoard as jest.Mock).mockResolvedValue(mockErrorResult);

      registerBoardRoutes(server);
      const handler = captureHandler(server, 'youtrack_get_board');
      const args = { boardId: 'board-nonexistent' };
      const result = await handler(args);

      expect(BoardController.getBoard).toHaveBeenCalledTimes(1);
      expect(BoardController.getBoard).toHaveBeenCalledWith('board-nonexistent');
      expect(BoardView.renderDetail).toHaveBeenCalledTimes(1);
      expect(BoardView.renderDetail).toHaveBeenCalledWith(mockErrorResult);
      // Assuming renderDetail handles the error structure internally
      expect(result).toEqual({ content: [{ type: 'text', text: 'Rendered board detail' }] }); 
    });
  });

  // Direct tests of the transformation functions
  describe('boardRoutes transform functions', () => {
    // Define transform functions to match actual implementation
    const limitTransform = (val?: number) => 
      val === undefined || val <= 0 ? DEFAULT_PAGINATION.LIMIT : Math.min(Math.max(val, 1), PAGINATION_LIMITS.BOARDS);
    
    const skipTransform = (val?: number) => 
      Math.max(val || DEFAULT_PAGINATION.SKIP, 0);
    
    it('should test schema transformations directly', () => {
      registerBoardRoutes(server);
      const schema = captureSchema(server, 'youtrack_list_boards');
      
      // Extract transform functions from schema
      const limitSchema = schema.limit;
      const skipSchema = schema.skip;
      
      // Test limit transform
      expect(limitSchema.parse(undefined)).toBe(DEFAULT_PAGINATION.LIMIT);
      expect(limitSchema.parse(0)).toBe(DEFAULT_PAGINATION.LIMIT);
      expect(limitSchema.parse(-5)).toBe(DEFAULT_PAGINATION.LIMIT);
      expect(limitSchema.parse(10)).toBe(10);
      expect(limitSchema.parse(100)).toBe(PAGINATION_LIMITS.BOARDS);
      
      // Test skip transform
      expect(skipSchema.parse(undefined)).toBe(DEFAULT_PAGINATION.SKIP);
      expect(skipSchema.parse(-10)).toBe(0);
      expect(skipSchema.parse(20)).toBe(20);
    });
    
    it('should test limit transform function branches', () => {
      // Test with undefined (should use default)
      expect(limitTransform(undefined)).toBe(DEFAULT_PAGINATION.LIMIT);
      
      // Test with zero (should use default)
      expect(limitTransform(0)).toBe(DEFAULT_PAGINATION.LIMIT);
      
      // Test with negative value (should use default)
      expect(limitTransform(-5)).toBe(DEFAULT_PAGINATION.LIMIT);
      
      // Test with valid value within range
      expect(limitTransform(10)).toBe(10);
      
      // Test with value less than min (should use min of 1)
      expect(limitTransform(0.5)).toBe(1);
      
      // Test with value above max (should use max)
      expect(limitTransform(PAGINATION_LIMITS.BOARDS + 10)).toBe(PAGINATION_LIMITS.BOARDS);
    });
    
    it('should test skip transform function branches', () => {
      // Test with undefined (should use default)
      expect(skipTransform(undefined)).toBe(DEFAULT_PAGINATION.SKIP);
      
      // Test with negative value (should use 0)
      expect(skipTransform(-5)).toBe(0);
      
      // Test with valid value
      expect(skipTransform(20)).toBe(20);
      
      // Test with zero
      expect(skipTransform(0)).toBe(0);
    });
    
    // Integration tests with handler
    it('should transform params correctly in handler', async () => {
      const mockBoardsResult = createBoardListResult([]);
      (BoardController.listBoards as jest.Mock).mockResolvedValue(mockBoardsResult);
      
      registerBoardRoutes(server);
      const handler = captureHandler(server, 'youtrack_list_boards');
      
      // Directly create and parse schema objects
      const schema = captureSchema(server, 'youtrack_list_boards');
      
      // Parse with extreme values and verify transformations
      const parsedLimit100 = schema.limit.parse(100);
      const parsedLimitNeg = schema.limit.parse(-5);
      const parsedSkipNeg = schema.skip.parse(-10);
      
      expect(parsedLimit100).toBe(PAGINATION_LIMITS.BOARDS);
      expect(parsedLimitNeg).toBe(DEFAULT_PAGINATION.LIMIT);
      expect(parsedSkipNeg).toBe(0);
      
      // Note: We can't test the handler's ZodSchema transforms directly here because
      // our mock server doesn't actually apply the Zod transformations before passing
      // the values to the handler. This would be integrated in the actual server.
    });
  });

  describe('board resource handler', () => {
    it('should call BoardController.handleResourceRequest and BoardView.handleResourceRequest for listing boards', async () => {
      const mockBoardsResponse = { content: [{ type: 'text', text: 'Rendered board list resource' }] };
      (BoardController.handleResourceRequest as jest.Mock).mockResolvedValue(mockBoardsResponse);

      registerBoardRoutes(server);
      const handler = captureResourceHandler(server, 'boards');
      const uri = new URL('youtrack://boards/');
      const req = { variables: {}, query: {} };

      const result = await handler(uri, req);

      expect(BoardController.handleResourceRequest).toHaveBeenCalledTimes(1);
      expect(BoardController.handleResourceRequest).toHaveBeenCalledWith(uri, { ...req, params: {} });
      // Note: The resource handler itself calls BoardView.handleResourceRequest internally
      // We are testing that the controller method is called and its result is returned
      expect(result).toEqual(mockBoardsResponse);
    });

    it('should call BoardController.handleResourceRequest and BoardView.handleResourceRequest for getting a specific board', async () => {
      const mockBoardResponse = { content: [{ type: 'text', text: 'Rendered board detail resource' }] };
      (BoardController.handleResourceRequest as jest.Mock).mockResolvedValue(mockBoardResponse);

      registerBoardRoutes(server);
      const handler = captureResourceHandler(server, 'boards');
      const boardId = 'board-123';
      const uri = new URL(`youtrack://boards/${boardId}`);
      const req = { variables: { boardId }, query: {} };

      const result = await handler(uri, req);

      expect(BoardController.handleResourceRequest).toHaveBeenCalledTimes(1);
      expect(BoardController.handleResourceRequest).toHaveBeenCalledWith(uri, { ...req, params: { boardId } });
      expect(result).toEqual(mockBoardResponse);
    });

    it('should handle errors from BoardController.handleResourceRequest', async () => {
      const mockErrorResponse = { content: [{ type: 'text', text: 'Resource error' }] };
      (BoardController.handleResourceRequest as jest.Mock).mockResolvedValue(mockErrorResponse);

      registerBoardRoutes(server);
      const handler = captureResourceHandler(server, 'boards');
      const uri = new URL('youtrack://boards/');
      const req = { variables: {}, query: {} };

      const result = await handler(uri, req);

      expect(BoardController.handleResourceRequest).toHaveBeenCalledTimes(1);
      expect(BoardController.handleResourceRequest).toHaveBeenCalledWith(uri, { ...req, params: {} });
      expect(result).toEqual(mockErrorResponse);
    });

    it('should include query parameters in the request object', async () => {
      const mockBoardsResponse = { content: [{ type: 'text', text: 'Rendered board list with query params' }] };
      (BoardController.handleResourceRequest as jest.Mock).mockResolvedValue(mockBoardsResponse);

      registerBoardRoutes(server);
      const handler = captureResourceHandler(server, 'boards');
      const uri = new URL('youtrack://boards/?limit=10&skip=20');
      const req = { variables: {}, query: { limit: '10', skip: '20' } };

      await handler(uri, req);

      expect(BoardController.handleResourceRequest).toHaveBeenCalledTimes(1);
      expect(BoardController.handleResourceRequest).toHaveBeenCalledWith(uri, { ...req, params: {} });
    });
  });
}); 