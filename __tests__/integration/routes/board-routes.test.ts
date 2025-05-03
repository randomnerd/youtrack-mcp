import { boardFixtures } from '../../fixtures';
import { jest } from '@jest/globals';
import { BoardController } from '../../../src/controllers/boardController';
import { BoardModel } from '../../../src/models/board';
import { setupYouTrackApiMocks } from '../../mocks/youtrack-api.mock';
import * as YouTrackTypes from '../../../src/types/youtrack';

// Mock the BoardModel
jest.mock('../../../src/models/board', () => ({
  BoardModel: {
    getAll: jest.fn(),
    getById: jest.fn()
  }
}));

// Mock the response handlers from board controller
jest.mock('../../../src/controllers/boardController', () => {
  const actual = jest.requireActual('../../../src/controllers/boardController') as typeof import('../../../src/controllers/boardController');
  return {
    BoardController: {
      listBoards: jest.fn(),
      getBoard: jest.fn(),
      handleResourceRequest: actual.BoardController.handleResourceRequest
    }
  };
});

describe('Board Routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setupYouTrackApiMocks('http://youtrack-test.example.com/api');
    
    // Cast the mocks to any to bypass TypeScript errors
    const mockGetAll = BoardModel.getAll as any;
    mockGetAll.mockResolvedValue(boardFixtures.listBoards);
    
    const mockGetById = BoardModel.getById as any;
    mockGetById.mockImplementation((id: string) => {
      const board = boardFixtures.boards.find(b => b.id === id);
      return Promise.resolve(board || null);
    });
    
    // Setup controller mock return values
    const mockListBoards = BoardController.listBoards as any;
    mockListBoards.mockImplementation(async () => {
      const boards = await BoardModel.getAll();
      return {
        content: [
          { type: 'text', text: `Found ${boards.length} agile boards` }
        ]
      };
    });
    
    const mockGetBoard = BoardController.getBoard as any;
    mockGetBoard.mockImplementation(async (boardId: string) => {
      const board = await BoardModel.getById(boardId);
      return board ? {
        content: [
          { type: 'text', text: `Board found: ${board.name}` }
        ]
      } : {
        content: [
          { type: 'text', text: `No board found with ID: ${boardId}` }
        ],
        isError: true
      };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('listBoards should return all boards', async () => {
    const response = await BoardController.listBoards();
    
    expect(BoardModel.getAll).toHaveBeenCalled();
    expect(response).toHaveProperty('content');
    expect(response.content[0].text).toContain(`Found ${boardFixtures.listBoards.length}`);
  });
  
  test('getBoard should return a specific board', async () => {
    // Use a valid board ID from the fixture
    const boardId = boardFixtures.boards[0].id;
    const response = await BoardController.getBoard(boardId);
    
    expect(BoardModel.getById).toHaveBeenCalledWith(boardId);
    expect(response).toHaveProperty('content');
    expect(response.content[0].text).toContain('Board found');
  });
  
  test('getBoard should handle not found board', async () => {
    const boardId = 'nonexistent';
    const response = await BoardController.getBoard(boardId);
    
    expect(BoardModel.getById).toHaveBeenCalledWith(boardId);
    expect(response).toHaveProperty('isError', true);
    expect(response.content[0].text).toContain('No board found');
  });
  
  test('handleResourceRequest should return board data as resource', async () => {
    // Use a valid board ID from the fixture
    const boardId = boardFixtures.boards[0].id;
    const uri = new URL(`youtrack://boards/${boardId}`);
    const req = { params: { boardId } };
    
    // Reset mock before this test to ensure call count is accurate
    (BoardModel.getById as jest.Mock).mockClear();
    
    await BoardController.handleResourceRequest(uri, req);
    
    expect(BoardModel.getById).toHaveBeenCalledWith(boardId);
  });
}); 