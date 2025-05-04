import { BoardView } from '../../../src/views/boardView';
import { formatYouTrackData } from '../../../src/utils/youtrack-json-formatter';
import { ControllerResult } from '../../../src/types/controllerResults';
import * as YouTrackTypes from '../../../src/types/youtrack';
import { URL } from 'url';

// Use real formatYouTrackData behavior for snapshot tests
jest.mock('../../../src/utils/youtrack-json-formatter', () => ({
  formatYouTrackData: jest.fn().mockImplementation((data, options) => {
    if (options?.stringify) {
      return JSON.stringify(data, null, 2);
    }
    return data;
  })
}));

describe('BoardView Snapshot Tests', () => {
  // Fixed timestamps for consistent snapshots
  const START_TIME_1 = 1746318950222;
  const END_TIME_1 = 1746319450222;
  const START_TIME_2 = 1746319950222;
  const END_TIME_2 = 1746320950222;
  
  const mockBoard: YouTrackTypes.Board = {
    id: 'board-1',
    name: 'Development Board',
    description: 'Main development board for the project',
    $type: 'Agile',
    owner: {
      id: 'user-1',
      name: 'Jane Doe',
      $type: 'User'
    },
    projects: [
      { id: 'project-1', name: 'Frontend', $type: 'Project' },
      { id: 'project-2', name: 'Backend', $type: 'Project' }
    ],
    sprints: [
      {
        id: 'sprint-1',
        name: 'Sprint 1',
        goal: 'Implement core features',
        start: START_TIME_1,
        finish: END_TIME_1,
        $type: 'Sprint'
      },
      {
        id: 'sprint-2',
        name: 'Sprint 2',
        goal: 'Polish UI components',
        start: START_TIME_2,
        finish: END_TIME_2,
        $type: 'Sprint'
      }
    ]
  };

  const mockBoards: YouTrackTypes.Board[] = [
    mockBoard,
    {
      id: 'board-2',
      name: 'Bug Tracking Board',
      description: 'Board for tracking bug fixes',
      $type: 'Agile',
      owner: {
        id: 'user-2',
        name: 'John Smith',
        $type: 'User'
      },
      projects: [
        { id: 'project-1', name: 'Frontend', $type: 'Project' }
      ],
      sprints: []
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('renderList', () => {
    it('should match snapshot for board list', () => {
      const controllerResult = {
        success: true,
        data: {
          boards: mockBoards,
          total: mockBoards.length
        }
      } as ControllerResult<any>;
      
      const result = BoardView.renderList(controllerResult);
      expect(result).toMatchSnapshot();
    });

    it('should match snapshot for empty board list', () => {
      const controllerResult = {
        success: true,
        data: {
          boards: [],
          total: 0
        }
      } as ControllerResult<any>;
      
      const result = BoardView.renderList(controllerResult);
      expect(result).toMatchSnapshot();
    });

    it('should match snapshot for error response', () => {
      const controllerResult = {
        success: false,
        error: 'Failed to fetch boards due to authentication error'
      } as ControllerResult<any>;
      
      const result = BoardView.renderList(controllerResult);
      expect(result).toMatchSnapshot();
    });
  });

  describe('renderDetail', () => {
    it('should match snapshot for board detail', () => {
      const controllerResult = {
        success: true,
        data: {
          board: mockBoard
        }
      } as ControllerResult<any>;
      
      const result = BoardView.renderDetail(controllerResult);
      expect(result).toMatchSnapshot();
    });

    it('should match snapshot for error in board detail', () => {
      const controllerResult = {
        success: false,
        error: 'Board not found'
      } as ControllerResult<any>;
      
      const result = BoardView.renderDetail(controllerResult);
      expect(result).toMatchSnapshot();
    });
  });

  describe('handleResourceRequest', () => {
    const uri = new URL('http://example.com/boards');
    
    it('should match snapshot for board list resource', () => {
      const result = BoardView.handleResourceRequest(uri, mockBoards);
      expect(result).toMatchSnapshot();
    });
    
    it('should match snapshot for single board resource', () => {
      const result = BoardView.handleResourceRequest(uri, mockBoard);
      expect(result).toMatchSnapshot();
    });

    it('should match snapshot for missing board data', () => {
      const result = BoardView.handleResourceRequest(uri, undefined);
      expect(result).toMatchSnapshot();
    });
  });
}); 