import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerBoardRoutes } from '../../../src/routes/boardRoutes';
import { BoardController } from '../../../src/controllers/boardController';
import { BoardView } from '../../../src/views/boardView';
import { createBoardListResult, createBoardDetailResult, createErrorResult } from '../../helpers/testHelpers';

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

describe('Board Routes', () => {
  let server: any;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock the McpServer instance and its 'tool' method
    server = {
      tool: jest.fn(),
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
}); 