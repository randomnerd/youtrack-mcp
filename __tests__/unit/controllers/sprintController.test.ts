import { jest } from '@jest/globals';
import * as YouTrackTypes from '../../../src/types/youtrack';
import {
  mockGetById,
  mockGetSprintIssues,
  mockFindSprints,
  mockBoardGetById,
  mockRenderError,
  mockRenderDetail,
  mockRenderList,
  mockHandleResourceRequest
} from '../../helpers/typedMocks';

// Mock dependencies
jest.mock('../../../src/models/sprint', () => ({
  SprintModel: {
    getById: mockGetById,
    getSprintIssues: mockGetSprintIssues,
    findSprints: mockFindSprints
  }
}));

jest.mock('../../../src/models/board', () => ({
  BoardModel: {
    getById: mockBoardGetById
  }
}));

jest.mock('../../../src/views/sprintView', () => ({
  SprintView: {
    renderError: mockRenderError,
    renderDetail: mockRenderDetail,
    renderList: mockRenderList,
    handleResourceRequest: mockHandleResourceRequest
  }
}));

// Now import the controller which uses these mocks
import { SprintController } from '../../../src/controllers/sprintController';
import { SprintModel } from '../../../src/models/sprint';
import { BoardModel } from '../../../src/models/board';
import { SprintView } from '../../../src/views/sprintView';

describe('SprintController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSprint', () => {
    test('should return sprint details when sprint exists', async () => {
      // Arrange
      const mockSprint: YouTrackTypes.Sprint = { id: 'sprint-1', name: 'Sprint 1', issues: [], $type: 'Sprint' };
      mockGetById.mockResolvedValue(mockSprint);
      mockRenderDetail.mockReturnValue({ success: true, data: mockSprint });

      // Act
      const result = await SprintController.getSprint('board-1', 'sprint-1');

      // Assert
      expect(mockGetById).toHaveBeenCalledWith('board-1', 'sprint-1');
      expect(mockRenderDetail).toHaveBeenCalledWith(mockSprint, 'board-1', undefined);
      expect(result).toEqual({ success: true, data: mockSprint });
    });

    test('should fetch sprint issues when sprint has no issues', async () => {
      // Arrange
      const mockSprint: YouTrackTypes.Sprint = { id: 'sprint-1', name: 'Sprint 1', issues: [], $type: 'Sprint' };
      const mockIssues: YouTrackTypes.Issue[] = [{ id: 'issue-1', summary: 'Test Issue', idReadable: 'TEST-1', numberInProject: 1, $type: 'Issue' }];
      mockGetById.mockResolvedValue(mockSprint);
      mockGetSprintIssues.mockResolvedValue(mockIssues);
      mockRenderDetail.mockReturnValue({ success: true, data: { ...mockSprint, issues: mockIssues } });

      // Act
      const result = await SprintController.getSprint('board-1', 'sprint-1');

      // Assert
      expect(mockGetById).toHaveBeenCalledWith('board-1', 'sprint-1');
      expect(mockGetSprintIssues).toHaveBeenCalledWith('Sprint 1');
      expect(mockRenderDetail).toHaveBeenCalledWith(mockSprint, 'board-1', mockIssues);
    });

    test('should return error when sprint does not exist', async () => {
      // Arrange
      mockGetById.mockResolvedValue(null);
      mockRenderError.mockReturnValue({ success: false, error: 'Sprint not found' });

      // Act
      const result = await SprintController.getSprint('board-1', 'non-existent');

      // Assert
      expect(mockGetById).toHaveBeenCalledWith('board-1', 'non-existent');
      expect(mockRenderError).toHaveBeenCalledWith('No sprint found with ID: non-existent on board: board-1');
      expect(result).toEqual({ success: false, error: 'Sprint not found' });
    });

    test('should handle error when fetching sprint issues', async () => {
      // Arrange
      const mockSprint: YouTrackTypes.Sprint = { id: 'sprint-1', name: 'Sprint 1', issues: [], $type: 'Sprint' };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockGetById.mockResolvedValue(mockSprint);
      mockGetSprintIssues.mockRejectedValue(new Error('API error'));
      mockRenderDetail.mockReturnValue({ success: true, data: mockSprint });

      // Act
      const result = await SprintController.getSprint('board-1', 'sprint-1');

      // Assert
      expect(mockGetById).toHaveBeenCalledWith('board-1', 'sprint-1');
      expect(mockGetSprintIssues).toHaveBeenCalledWith('Sprint 1');
      expect(console.error).toHaveBeenCalled();
      expect(mockRenderDetail).toHaveBeenCalledWith(mockSprint, 'board-1', []);
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe('findSprints', () => {
    test('should return sprints with board name when boardId is provided', async () => {
      // Arrange
      const mockSprints: YouTrackTypes.Sprint[] = [{ id: 'sprint-1', name: 'Sprint 1', $type: 'Sprint' }];
      const mockBoard: YouTrackTypes.Board = { id: 'board-1', name: 'Board 1', $type: 'Agile' };
      const options = { boardId: 'board-1', status: 'active' as const };
      
      mockFindSprints.mockResolvedValue(mockSprints);
      mockBoardGetById.mockResolvedValue(mockBoard);
      mockRenderList.mockReturnValue({ success: true, data: mockSprints });

      // Act
      const result = await SprintController.findSprints(options);

      // Assert
      expect(mockFindSprints).toHaveBeenCalledWith(options);
      expect(mockBoardGetById).toHaveBeenCalledWith('board-1');
      expect(mockRenderList).toHaveBeenCalledWith(mockSprints, 'Board 1');
      expect(result).toEqual({ success: true, data: mockSprints });
    });

    test('should return sprints without board name when boardId is not provided', async () => {
      // Arrange
      const mockSprints: YouTrackTypes.Sprint[] = [{ id: 'sprint-1', name: 'Sprint 1', $type: 'Sprint' }];
      const options = { status: 'all' as const };
      
      mockFindSprints.mockResolvedValue(mockSprints);
      mockRenderList.mockReturnValue({ success: true, data: mockSprints });

      // Act
      const result = await SprintController.findSprints(options);

      // Assert
      expect(mockFindSprints).toHaveBeenCalledWith(options);
      expect(mockBoardGetById).not.toHaveBeenCalled();
      expect(mockRenderList).toHaveBeenCalledWith(mockSprints, undefined);
      expect(result).toEqual({ success: true, data: mockSprints });
    });

    test('should handle error when fetching board details', async () => {
      // Arrange
      const mockSprints: YouTrackTypes.Sprint[] = [{ id: 'sprint-1', name: 'Sprint 1', $type: 'Sprint' }];
      const options = { boardId: 'board-1' };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockFindSprints.mockResolvedValue(mockSprints);
      mockBoardGetById.mockRejectedValue(new Error('Board API error'));
      mockRenderList.mockReturnValue({ success: true, data: mockSprints });

      // Act
      const result = await SprintController.findSprints(options);

      // Assert
      expect(mockFindSprints).toHaveBeenCalledWith(options);
      expect(mockBoardGetById).toHaveBeenCalledWith('board-1');
      expect(console.error).toHaveBeenCalled();
      expect(mockRenderList).toHaveBeenCalledWith(mockSprints, undefined);
      expect(result).toEqual({ success: true, data: mockSprints });
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe('handleResourceRequest', () => {
    test('should return error when boardId is not provided', async () => {
      // Arrange
      const mockUri = new URL('http://example.com/api/sprints');
      const mockReq = { params: {} };
      
      // Act
      const result = await SprintController.handleResourceRequest(mockUri, mockReq);

      // Assert
      expect(result).toEqual({
        contents: [{
          uri: mockUri.href,
          text: "Board ID is required."
        }]
      });
    });

    test('should render sprint detail when sprintId is provided', async () => {
      // Arrange
      const mockUri = new URL('http://example.com/api/boards/board-1/sprints/sprint-1');
      const mockReq = { params: { boardId: 'board-1', sprintId: 'sprint-1' } };
      const mockSprint: YouTrackTypes.Sprint = { id: 'sprint-1', name: 'Sprint 1', $type: 'Sprint' };
      const mockBoard: YouTrackTypes.Board = { id: 'board-1', name: 'Board 1', $type: 'Agile' };
      const mockResponse = { contents: [{ uri: mockUri.href, text: 'Sprint details' }] };
      
      mockGetById.mockResolvedValue(mockSprint);
      mockBoardGetById.mockResolvedValue(mockBoard);
      mockHandleResourceRequest.mockReturnValue(mockResponse);

      // Act
      const result = await SprintController.handleResourceRequest(mockUri, mockReq);

      // Assert
      expect(mockGetById).toHaveBeenCalledWith('board-1', 'sprint-1');
      expect(mockHandleResourceRequest).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    test('should render board sprints when only boardId is provided', async () => {
      // Arrange
      const mockUri = new URL('http://example.com/api/boards/board-1/sprints');
      const mockReq = { params: { boardId: 'board-1' } };
      const mockBoard: YouTrackTypes.Board = { 
        id: 'board-1', 
        name: 'Board 1',
        $type: 'Agile',
        sprints: [{ id: 'sprint-1', name: 'Sprint 1', $type: 'Sprint' }]
      };
      const mockResponse = { contents: [{ uri: mockUri.href, text: 'Board sprints' }] };
      
      mockBoardGetById.mockResolvedValue(mockBoard);
      mockHandleResourceRequest.mockReturnValue(mockResponse);

      // Act
      const result = await SprintController.handleResourceRequest(mockUri, mockReq);

      // Assert
      expect(mockBoardGetById).toHaveBeenCalledWith('board-1');
      expect(mockHandleResourceRequest).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    test('should handle error when sprint or board is not found', async () => {
      // Arrange
      const mockUri = new URL('http://example.com/api/boards/board-1/sprints/sprint-1');
      const mockReq = { params: { boardId: 'board-1', sprintId: 'sprint-1' } };
      
      mockGetById.mockResolvedValue(null);
      
      // Act
      const result = await SprintController.handleResourceRequest(mockUri, mockReq);

      // Assert
      expect(mockGetById).toHaveBeenCalledWith('board-1', 'sprint-1');
      expect(result).toEqual({
        contents: [{
          uri: mockUri.href,
          text: "Sprint not found."
        }]
      });
    });

    test('should handle error when board is not found', async () => {
      // Arrange
      const mockUri = new URL('http://example.com/api/boards/board-1/sprints');
      const mockReq = { params: { boardId: 'board-1' } };
      
      mockBoardGetById.mockResolvedValue(null);
      
      // Act
      const result = await SprintController.handleResourceRequest(mockUri, mockReq);

      // Assert
      expect(mockBoardGetById).toHaveBeenCalledWith('board-1');
      expect(result).toEqual({
        contents: [{
          uri: mockUri.href,
          text: "Board not found."
        }]
      });
    });
  });
}); 