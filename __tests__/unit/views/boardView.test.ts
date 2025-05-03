import { BoardView } from '../../../src/views/boardView';
import * as YouTrackTypes from '../../../src/types/youtrack';
import { formatYouTrackData } from '../../../src/utils/youtrack-json-formatter';
import { ControllerResult, BoardDetailResult, BoardListResult } from '../../../src/types/controllerResults';
import { createBoardDetailResult, createBoardListResult } from '../../helpers/testHelpers';
import { URL } from 'url';

// Mock the correct dependency
jest.mock('../../../src/utils/youtrack-json-formatter', () => ({
  formatYouTrackData: jest.fn().mockImplementation((data, options) => {
    // Simple mock for testing purposes
    if (Array.isArray(data)) {
      // Special case for empty array handled by view
      if (data.length === 0) return ''; 
      return `Formatted ${data.length} boards`;
    }
    return `Formatted board ${data?.id || 'unknown'}`;
  })
}));

// Mock board data
const mockBoard: YouTrackTypes.Board = {
  id: 'board-1',
  name: 'Test Board',
  $type: 'Agile',
  projects: [{ id: 'project-1', name: 'Project 1', $type: 'Project' }],
  sprints: [{ id: 'sprint-1', name: 'Sprint 1', start: Date.now() - 10000, finish: Date.now() + 10000, $type: 'Sprint' }]
};

const mockBoards: YouTrackTypes.Board[] = [
  mockBoard,
  { ...mockBoard, id: 'board-2', name: 'Another Board' }
];

describe('BoardView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementation before each test
    (formatYouTrackData as jest.Mock).mockImplementation((data, options) => {
      if (Array.isArray(data)) {
        if (data.length === 0) return ''; // Consistent with view logic
        return `Formatted ${data.length} boards`;
      }
      return `Formatted board ${data?.id || 'unknown'}`;
    });
  });

  describe('renderList', () => {
    it('should render a list of boards', () => {
      const controllerResult = createBoardListResult(mockBoards);
      const result = BoardView.renderList(controllerResult);
      
      expect(result).toHaveProperty('content');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toBe(`Formatted ${mockBoards.length} boards`);
      expect(formatYouTrackData).toHaveBeenCalledWith(mockBoards, { stringify: true });
    });

    it('should handle empty boards list', () => {
      const controllerResult = createBoardListResult([]);
      const result = BoardView.renderList(controllerResult);
      
      expect(result).toHaveProperty('content');
      expect(result.content).toHaveLength(1);
      // Check for the specific output from formatYouTrackData for empty array
      expect(result.content[0].text).toBe('');
      expect(formatYouTrackData).toHaveBeenCalledWith([], { stringify: true });
    });
  });

  describe('renderDetail', () => {
    it('should render board details', () => {
      const controllerResult = createBoardDetailResult(mockBoard);
      const result = BoardView.renderDetail(controllerResult);
      
      expect(result).toHaveProperty('content');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toBe(`Formatted board ${mockBoard.id}`);
      expect(formatYouTrackData).toHaveBeenCalledWith(mockBoard, { stringify: true });
    });
  });

  describe('handleResourceRequest', () => {
    const uri = new URL('http://example.com/boards');
    
    it('should handle an array of boards', () => {
      const result = BoardView.handleResourceRequest(uri, mockBoards);
      
      expect(result).toHaveProperty('contents');
      expect(result.contents[0].uri).toBe(uri.href);
      expect((result.contents[0] as { uri: string, text: string }).text).toBe(`Formatted ${mockBoards.length} boards`);
      expect(formatYouTrackData).toHaveBeenCalledWith(mockBoards, { stringify: true });
    });
    
    it('should handle a single board', () => {
      const result = BoardView.handleResourceRequest(uri, mockBoard);
      
      expect(result).toHaveProperty('contents');
      expect(result.contents[0].uri).toBe(uri.href);
      expect((result.contents[0] as { uri: string, text: string }).text).toBe(`Formatted board ${mockBoard.id}`);
      expect(formatYouTrackData).toHaveBeenCalledWith(mockBoard, { stringify: true });
    });

    it('should handle a board without sprints', () => {
      const boardNoSprints = { ...mockBoard, sprints: undefined };
      const result = BoardView.handleResourceRequest(uri, boardNoSprints);
      
      expect(result).toHaveProperty('contents');
      expect((result.contents[0] as { uri: string, text: string }).text).toBe(`Formatted board ${boardNoSprints.id}`);
      expect(formatYouTrackData).toHaveBeenCalledWith(boardNoSprints, { stringify: true });
    });

    it('should handle undefined board data', () => {
      const result = BoardView.handleResourceRequest(uri, undefined);
      
      expect(result).toHaveProperty('contents');
      expect((result.contents[0] as { uri: string, text: string }).text).toContain('No board data available');
      expect(formatYouTrackData).not.toHaveBeenCalled();
    });
  });

  describe('renderEmpty', () => {
    it('should render an empty message', () => {
      const message = 'No boards found';
      
      const result = BoardView.renderEmpty(message);
      
      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toBe(message);
    });
  });

  describe('renderError', () => {
    it('should render an error message', () => {
      const errorMessage = 'Failed to load boards';
      
      const result = BoardView.renderError(errorMessage);
      
      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toBe(`Error: ${errorMessage}`);
      expect(result.isError).toBe(true);
    });
  });
}); 