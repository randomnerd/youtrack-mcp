import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerBoardRoutes } from '../../../src/routes/boardRoutes';
import { BoardController } from '../../../src/controllers/boardController';
import { BoardView } from '../../../src/views/boardView';
import { createBoardListResult, createBoardDetailResult, createErrorResult } from '../../helpers/testHelpers';

// Mock the BoardController and BoardView
jest.mock('../../../src/controllers/boardController');
jest.mock('../../../src/views/boardView');

describe('Board Routes', () => {
  // Create a mock server
  const server = {
    tool: jest.fn()
  } as unknown as McpServer;
  
  beforeEach(() => {
    // Clear all mocks
    jest.resetAllMocks();
    
    // Mock the BoardView methods
    (BoardView.renderList as jest.Mock).mockReturnValue({
      content: [{ type: 'text', text: 'Rendered board list' }]
    });
    
    (BoardView.renderDetail as jest.Mock).mockReturnValue({
      content: [{ type: 'text', text: 'Rendered board detail' }]
    });
    
    (BoardView.renderError as jest.Mock).mockReturnValue({
      content: [{ type: 'text', text: 'Error: Failed to fetch board' }],
      isError: true
    });
  });
  
  it('should register board routes on the server', () => {
    // Register routes
    registerBoardRoutes(server);
    
    // Check if tool method was called twice (once for each route)
    expect(server.tool).toHaveBeenCalledTimes(2);
    
    // Check that the list_boards route was registered
    expect(server.tool).toHaveBeenCalledWith(
      'youtrack_list_boards',
      'List all available agile boards',
      expect.anything(),
      expect.any(Function)
    );
    
    // Check that the get_board route was registered
    expect(server.tool).toHaveBeenCalledWith(
      'youtrack_get_board',
      'Get details of a specific agile board',
      expect.objectContaining({
        boardId: expect.anything()
      }),
      expect.any(Function)
    );
  });
  
  it('should call BoardController.getBoards when list_boards route is called', async () => {
    // Mock implementation
    const boards = [
      { id: 'board-1', name: 'Test Board 1' },
      { id: 'board-2', name: 'Test Board 2' }
    ];
    const controllerResult = createBoardListResult(boards as any);
    (BoardController.getBoards as jest.Mock).mockResolvedValue(controllerResult);
    
    // Register routes
    registerBoardRoutes(server);
    
    // Get the route handler function
    const routeHandler = (server.tool as jest.Mock).mock.calls[0][3];
    
    // Call the route handler
    const result = await routeHandler({});
    
    // Check if controller method was called
    expect(BoardController.getBoards).toHaveBeenCalledTimes(1);
    expect(BoardView.renderList).toHaveBeenCalledWith(boards);
    expect(result).toEqual({
      content: [{ type: 'text', text: 'Rendered board list' }]
    });
  });
  
  it('should call BoardController.getBoard when get_board route is called', async () => {
    // Mock implementation
    const board = { id: 'board-1', name: 'Test Board 1' };
    const controllerResult = createBoardDetailResult(board as any);
    (BoardController.getBoard as jest.Mock).mockResolvedValue(controllerResult);
    
    // Register routes
    registerBoardRoutes(server);
    
    // Get the route handler function
    const routeHandler = (server.tool as jest.Mock).mock.calls[1][3];
    
    // Call the route handler with boardId
    const result = await routeHandler({ boardId: 'board-1' });
    
    // Check if controller method was called with correct parameters
    expect(BoardController.getBoard).toHaveBeenCalledWith('board-1');
    expect(BoardView.renderDetail).toHaveBeenCalledWith(board);
    expect(result).toEqual({
      content: [{ type: 'text', text: 'Rendered board detail' }]
    });
  });
  
  it('should handle errors when getBoards fails', async () => {
    // Mock implementation
    const errorResult = createErrorResult('Failed to fetch boards');
    (BoardController.getBoards as jest.Mock).mockResolvedValue(errorResult);
    
    // Register routes
    registerBoardRoutes(server);
    
    // Get the route handler function
    const routeHandler = (server.tool as jest.Mock).mock.calls[0][3];
    
    // Call the route handler
    const result = await routeHandler({});
    
    // Check if controller method was called and error is handled
    expect(BoardController.getBoards).toHaveBeenCalledTimes(1);
    expect(BoardView.renderError).toHaveBeenCalledWith('Failed to fetch boards');
    expect(result).toEqual({
      content: [{ type: 'text', text: 'Error: Failed to fetch board' }],
      isError: true
    });
  });
}); 