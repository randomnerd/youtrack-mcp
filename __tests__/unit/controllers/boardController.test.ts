import { boardFixtures } from '../../fixtures';
import { BoardController } from '../../../src/controllers/boardController';
import { BoardModel } from '../../../src/models/board';
import { Board } from '../../../src/types/youtrack';

// Mock the BoardModel
jest.mock('../../../src/models/board', () => ({
  BoardModel: {
    getAll: jest.fn(),
    getById: jest.fn()
  }
}));

describe('Board Controller', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('listBoards', () => {
    it('should return all boards', async () => {
      // Setup the mock implementation
      (BoardModel.getAll as jest.Mock).mockResolvedValue(boardFixtures.boards);
      
      // Call the controller function
      const result = await BoardController.listBoards();
      
      // Verify the results
      expect(BoardModel.getAll).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('should handle empty boards list', async () => {
      // Setup empty boards list
      (BoardModel.getAll as jest.Mock).mockResolvedValue([]);
      
      const result = await BoardController.listBoards();
      
      expect(BoardModel.getAll).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
      // Content should contain message about no boards found
      expect(JSON.stringify(result.content)).toContain('No agile boards found');
    });

    it('should handle errors', async () => {
      const errorMessage = 'Failed to fetch boards';
      (BoardModel.getAll as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      const result = await BoardController.listBoards();
      
      expect(BoardModel.getAll).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('isError', true);
      // Error message should be in the content
      expect(JSON.stringify(result.content)).toContain(errorMessage);
    });
  });

  describe('getBoard', () => {
    it('should return a specific board', async () => {
      // Use one of the existing board IDs from the fixture
      const boardId = boardFixtures.boards[0].id;
      const board = boardFixtures.boards[0];
      
      (BoardModel.getById as jest.Mock).mockResolvedValue(board);
      
      const result = await BoardController.getBoard(boardId);
      
      expect(BoardModel.getById).toHaveBeenCalledWith(boardId);
      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
      // Content should contain board name
      expect(JSON.stringify(result.content)).toContain(board.name);
    });

    it('should handle board not found', async () => {
      const boardId = 'nonexistent';
      
      (BoardModel.getById as jest.Mock).mockResolvedValue(null);
      
      const result = await BoardController.getBoard(boardId);
      
      expect(BoardModel.getById).toHaveBeenCalledWith(boardId);
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('isError', true);
      // Error message should be in the content
      expect(JSON.stringify(result.content)).toContain('No board found');
    });

    it('should handle errors', async () => {
      const boardId = boardFixtures.boards[0].id;
      (BoardModel.getById as jest.Mock).mockRejectedValue(new Error('Board fetch error'));
      
      const result = await BoardController.getBoard(boardId);
      
      expect(BoardModel.getById).toHaveBeenCalledWith(boardId);
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('isError', true);
      // Error message should be in the content
      expect(JSON.stringify(result.content)).toContain('Board fetch error');
    });
  });
}); 