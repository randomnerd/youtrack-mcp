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

  describe('getBoards', () => {
    it('should return all boards', async () => {
      // Setup the mock implementation
      (BoardModel.getAll as jest.Mock).mockResolvedValue(boardFixtures.boards);
      
      // Call the controller function
      const result = await BoardController.getBoards();
      
      // Verify the results
      expect(BoardModel.getAll).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('boards');
      expect(Array.isArray(result.data?.boards)).toBe(true);
      expect(result.data?.boards.length).toBeGreaterThan(0);
    });

    it('should handle empty boards list', async () => {
      // Setup empty boards list
      (BoardModel.getAll as jest.Mock).mockResolvedValue([]);
      
      const result = await BoardController.getBoards();
      
      expect(BoardModel.getAll).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('boards');
      expect(Array.isArray(result.data?.boards)).toBe(true);
      expect(result.data?.boards.length).toBe(0);
      expect(result.data?.total).toBe(0);
    });

    it('should handle errors', async () => {
      const errorMessage = 'Failed to fetch boards';
      (BoardModel.getAll as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      const result = await BoardController.getBoards();
      
      expect(BoardModel.getAll).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain(errorMessage);
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
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('board');
      expect(result.data?.board.name).toBe(board.name);
    });

    it('should handle board not found', async () => {
      const boardId = 'nonexistent';
      
      (BoardModel.getById as jest.Mock).mockResolvedValue(null);
      
      const result = await BoardController.getBoard(boardId);
      
      expect(BoardModel.getById).toHaveBeenCalledWith(boardId);
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('No board found');
    });

    it('should handle errors', async () => {
      const boardId = boardFixtures.boards[0].id;
      (BoardModel.getById as jest.Mock).mockRejectedValue(new Error('Board fetch error'));
      
      const result = await BoardController.getBoard(boardId);
      
      expect(BoardModel.getById).toHaveBeenCalledWith(boardId);
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Board fetch error');
    });
  });
}); 