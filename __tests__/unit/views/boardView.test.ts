import { BoardView } from '../../../src/views/boardView';
import { formatBoardListItem, formatBoardProjects, formatSprintDetailItem } from '../../../src/utils/view-utils';
import { URL } from 'url';

// Mock the view-utils functions
jest.mock('../../../src/utils/view-utils', () => ({
  formatBoardListItem: jest.fn().mockImplementation((board) => `Board: ${board.name}`),
  formatBoardProjects: jest.fn().mockImplementation((board) => 
    board.projects ? board.projects.map(p => p.name).join(', ') : 'None'
  ),
  formatSprintDetailItem: jest.fn().mockImplementation((sprint) => `Sprint: ${sprint.name}`)
}));

describe('BoardView', () => {
  const mockBoard = {
    id: 'board-1',
    name: 'Test Board',
    projects: [
      { id: 'project-1', name: 'Project 1' },
      { id: 'project-2', name: 'Project 2' }
    ],
    sprints: [
      { id: 'sprint-1', name: 'Sprint 1', start: 1620000000000, finish: 1622000000000 },
      { id: 'sprint-2', name: 'Sprint 2', start: 1623000000000, finish: 1625000000000 }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('renderList', () => {
    it('should render a list of boards', () => {
      const boards = [mockBoard, { ...mockBoard, id: 'board-2', name: 'Another Board' }];
      
      const result = BoardView.renderList(boards);
      
      expect(result).toHaveProperty('content');
      expect(result.content).toHaveLength(2);
      expect(result.content[0].text).toContain('Found 2 agile boards');
      expect(formatBoardListItem).toHaveBeenCalledTimes(2);
    });

    it('should handle empty boards list', () => {
      const result = BoardView.renderList([]);
      
      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('Found 0 agile boards');
    });
  });

  describe('renderDetail', () => {
    it('should render board details', () => {
      const result = BoardView.renderDetail(mockBoard);
      
      expect(result).toHaveProperty('content');
      expect(result.content).toHaveLength(2);
      expect(result.content[0].text).toContain(`Board "${mockBoard.name}"`);
      expect(formatBoardProjects).toHaveBeenCalledWith(mockBoard);
      expect(formatSprintDetailItem).toHaveBeenCalledTimes(2);
    });

    it('should handle board without sprints', () => {
      const boardWithoutSprints = { ...mockBoard, sprints: [] };
      
      const result = BoardView.renderDetail(boardWithoutSprints);
      
      expect(result).toHaveProperty('content');
      expect(result.content[1].text).toContain('No sprints found');
      expect(formatSprintDetailItem).not.toHaveBeenCalled();
    });

    it('should handle board without projects', () => {
      const boardWithoutProjects = { ...mockBoard, projects: undefined };
      
      const result = BoardView.renderDetail(boardWithoutProjects);
      
      expect(result).toHaveProperty('content');
      expect(formatBoardProjects).toHaveBeenCalledWith(boardWithoutProjects);
    });
  });

  describe('handleResourceRequest', () => {
    it('should handle undefined board', () => {
      const uri = new URL('http://example.com/boards');
      
      const result = BoardView.handleResourceRequest(uri, undefined);
      
      expect(result).toHaveProperty('contents');
      expect((result.contents[0] as { uri: string, text: string }).text).toBe('No board data available');
    });

    it('should handle an array of boards', () => {
      const uri = new URL('http://example.com/boards');
      const boards = [mockBoard, { ...mockBoard, id: 'board-2', name: 'Another Board' }];
      
      const result = BoardView.handleResourceRequest(uri, boards);
      
      expect(result).toHaveProperty('contents');
      expect(result.contents[0].uri).toBe(uri.href);
      expect((result.contents[0] as { uri: string, text: string }).text).toContain('Found 2 agile boards');
      expect(formatBoardListItem).toHaveBeenCalledTimes(2);
    });

    it('should handle a single board', () => {
      const uri = new URL('http://example.com/boards/board-1');
      
      const result = BoardView.handleResourceRequest(uri, mockBoard);
      
      expect(result).toHaveProperty('contents');
      expect(result.contents[0].uri).toBe(uri.href);
      expect((result.contents[0] as { uri: string, text: string }).text).toContain(`Board: ${mockBoard.name}`);
      expect(formatBoardProjects).toHaveBeenCalledWith(mockBoard);
      expect(formatSprintDetailItem).toHaveBeenCalledTimes(2);
    });

    it('should handle a board without sprints', () => {
      const uri = new URL('http://example.com/boards/board-1');
      const boardWithoutSprints = { ...mockBoard, sprints: [] };
      
      const result = BoardView.handleResourceRequest(uri, boardWithoutSprints);
      
      expect(result).toHaveProperty('contents');
      expect((result.contents[0] as { uri: string, text: string }).text).toContain('No sprints found');
      expect(formatSprintDetailItem).not.toHaveBeenCalled();
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
      expect(result.content[0].text).toBe(errorMessage);
      expect(result.isError).toBe(true);
    });
  });
}); 