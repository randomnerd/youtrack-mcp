import { BoardModel } from '../../../src/models/board';
import youtrackClient from '../../../src/youtrack-client';

// Mock test data
const mockBoards = [
  { id: 'board-1', name: 'Test Board 1' },
  { id: 'board-2', name: 'Test Board 2' }
];

// Mock youtrackClient
jest.mock('../../../src/youtrack-client', () => ({
  __esModule: true,
  default: {
    listBoards: jest.fn().mockResolvedValue([
      { id: 'board-1', name: 'Test Board 1' },
      { id: 'board-2', name: 'Test Board 2' }
    ]),
    getBoard: jest.fn().mockImplementation((boardId) => {
      if (boardId === 'nonexistent') {
        return Promise.resolve(null);
      }
      return Promise.resolve(mockBoards.find(b => b.id === boardId));
    })
  }
}));

describe('BoardModel', () => {
  describe('getAll', () => {
    it('should return a list of all boards', async () => {
      const boards = await BoardModel.getAll();
      expect(boards).toBeDefined();
      expect(boards.length).toBeGreaterThan(0);
      expect(youtrackClient.listBoards).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return a board by its ID', async () => {
      const boardId = mockBoards[0].id;
      const board = await BoardModel.getById(boardId);
      expect(board).toBeDefined();
      expect(board).not.toBeNull();
      expect(youtrackClient.getBoard).toHaveBeenCalledWith(boardId);
    });

    it('should return null for non-existent board ID', async () => {
      const board = await BoardModel.getById('nonexistent');
      expect(board).toBeNull();
      expect(youtrackClient.getBoard).toHaveBeenCalledWith('nonexistent');
    });
  });
}); 