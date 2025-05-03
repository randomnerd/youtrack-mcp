import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerBoardRoutes } from '../../../src/routes/boardRoutes';
import { BoardController } from '../../../src/controllers/boardController';

// Mock the BoardController
jest.mock('../../../src/controllers/boardController');

describe('Board Routes', () => {
  let server: McpServer;
  
  beforeEach(() => {
    // Create a mock MCP server
    server = {
      tool: jest.fn(),
    } as unknown as McpServer;
    
    // Reset controller mocks
    jest.resetAllMocks();
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
      {},
      expect.any(Function)
    );
    
    // Check that the get_board route was registered
    expect(server.tool).toHaveBeenCalledWith(
      'youtrack_get_board',
      'Get details of a specific agile board',
      {
        boardId: expect.any(Object) // zod schema object
      },
      expect.any(Function)
    );
  });
  
  it('should call BoardController.listBoards when list_boards route is called', async () => {
    // Mock implementation
    (BoardController.listBoards as jest.Mock).mockResolvedValue([
      { id: 'board-1', name: 'Test Board' }
    ]);
    
    // Register routes
    registerBoardRoutes(server);
    
    // Get the route handler function (first argument of the second call to server.tool)
    const routeHandler = (server.tool as jest.Mock).mock.calls[0][3];
    
    // Call the route handler
    const result = await routeHandler();
    
    // Check if controller method was called
    expect(BoardController.listBoards).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: 'board-1', name: 'Test Board' }]);
  });
  
  it('should call BoardController.getBoard when get_board route is called', async () => {
    // Mock implementation
    (BoardController.getBoard as jest.Mock).mockResolvedValue(
      { id: 'board-1', name: 'Test Board' }
    );
    
    // Register routes
    registerBoardRoutes(server);
    
    // Get the route handler function (first argument of the second call to server.tool)
    const routeHandler = (server.tool as jest.Mock).mock.calls[1][3];
    
    // Call the route handler with boardId
    const result = await routeHandler({ boardId: 'board-1' });
    
    // Check if controller method was called with correct parameters
    expect(BoardController.getBoard).toHaveBeenCalledWith('board-1');
    expect(result).toEqual({ id: 'board-1', name: 'Test Board' });
  });
}); 