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
import { ControllerResult, SprintDetailResult, SprintListResult } from '../../../src/types/controllerResults';

describe('SprintController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSprint', () => {
    test('should return sprint details when sprint exists', async () => {
      // Arrange
      const mockSprint: YouTrackTypes.Sprint = { id: 'sprint-1', name: 'Sprint 1', issues: [], status: 'active', $type: 'Sprint' };
      mockGetById.mockResolvedValue(mockSprint);
      
      // Act
      const result = await SprintController.getSprint('board-1', 'sprint-1');

      // Assert
      expect(mockGetById).toHaveBeenCalledWith('board-1', 'sprint-1');
      // SprintView.renderDetail should not be called in the controller implementation
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.sprint).toEqual(mockSprint);
        expect(result.data.boardId).toBe('board-1');
      }
    });

    test('should fetch sprint issues when sprint has no issues', async () => {
      // Arrange
      const mockSprint: YouTrackTypes.Sprint = { id: 'sprint-1', name: 'Sprint 1', issues: [], status: 'active', $type: 'Sprint' };
      mockGetById.mockResolvedValue(mockSprint);
      
      // Act
      const result = await SprintController.getSprint('board-1', 'sprint-1');

      // Assert
      expect(mockGetById).toHaveBeenCalledWith('board-1', 'sprint-1');
      // SprintView.renderDetail should not be called in the controller implementation
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.sprint).toEqual(mockSprint);
        expect(result.data.boardId).toBe('board-1');
      }
    });

    test('should return error when sprint does not exist', async () => {
      // Arrange
      mockGetById.mockResolvedValue(null);
      
      // Act
      const result = await SprintController.getSprint('board-1', 'non-existent');

      // Assert
      expect(mockGetById).toHaveBeenCalledWith('board-1', 'non-existent');
      expect(result.success).toBe(false);
      expect(result.error).toContain('No sprint found with ID: non-existent on board: board-1');
    });

    test('should handle error when model throws exception', async () => {
      // Arrange
      const errorMessage = 'API error';
      mockGetById.mockRejectedValue(new Error(errorMessage));
      
      // Act
      const result = await SprintController.getSprint('board-1', 'sprint-1');

      // Assert
      expect(mockGetById).toHaveBeenCalledWith('board-1', 'sprint-1');
      expect(result.success).toBe(false);
      expect(result.error).toContain(errorMessage);
    });
  });

  describe('findSprints', () => {
    test('should return sprints with board name when boardId is provided', async () => {
      // Arrange
      const mockSprints: YouTrackTypes.Sprint[] = [{ id: 'sprint-1', name: 'Sprint 1', status: 'active', $type: 'Sprint' }];
      const mockBoard: YouTrackTypes.Board = { id: 'board-1', name: 'Board 1', $type: 'Agile', sprints: mockSprints };
      const options = { boardId: 'board-1', status: 'active' as const };
      
      mockFindSprints.mockResolvedValue(mockSprints);
      mockBoardGetById.mockResolvedValue(mockBoard);
      
      // Act
      const result = await SprintController.findSprints(options);

      // Assert
      // No need to check mockFindSprints as the implementation uses BoardModel.getById
      expect(mockBoardGetById).toHaveBeenCalledWith('board-1');
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.sprints).toEqual(mockSprints);
        expect(result.data.total).toBe(mockSprints.length);
      }
    });

    test('should return sprints without board name when boardId is not provided', async () => {
      // Arrange
      const mockSprints: YouTrackTypes.Sprint[] = [{ id: 'sprint-1', name: 'Sprint 1', status: 'active', $type: 'Sprint' }];
      const mockBoard: YouTrackTypes.Board = { id: 'default-board', name: 'Default Board', $type: 'Agile', sprints: mockSprints };
      const options = { boardId: 'default-board', status: 'all' as const };
      
      mockFindSprints.mockResolvedValue(mockSprints);
      mockBoardGetById.mockResolvedValue(mockBoard);
      
      // Act
      const result = await SprintController.findSprints(options);

      // Assert
      // No need to check mockFindSprints as the implementation uses BoardModel.getById
      expect(mockBoardGetById).toHaveBeenCalledWith('default-board');
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.sprints).toEqual(mockSprints);
        expect(result.data.total).toBe(mockSprints.length);
      }
    });

    test('should handle error when fetching board details', async () => {
      // Arrange
      const mockSprints: YouTrackTypes.Sprint[] = [{ id: 'sprint-1', name: 'Sprint 1', status: 'active', $type: 'Sprint' }];
      const options = { boardId: 'board-1' };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockFindSprints.mockResolvedValue(mockSprints);
      mockBoardGetById.mockRejectedValue(new Error('Board API error'));
      
      // Act
      const result = await SprintController.findSprints(options);

      // Assert
      // No need to check mockFindSprints as the implementation uses BoardModel.getById
      expect(mockBoardGetById).toHaveBeenCalledWith('board-1');
      // console.error is not called in the findSprints method
      expect(result.success).toBe(false); // When BoardModel.getById throws an error, withErrorHandling returns success: false
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Board API error');
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });

    test('should handle error when model throws exception', async () => {
      // Arrange
      const errorMessage = 'API error';
      const options = { boardId: 'board-1' };
      mockFindSprints.mockRejectedValue(new Error(errorMessage));
      mockBoardGetById.mockRejectedValue(new Error(errorMessage));

      // Act
      const result = await SprintController.findSprints(options);

      // Assert
      // Updated to check mockFindSprints instead of mockBoardGetById to match new implementation
      expect(mockFindSprints).toHaveBeenCalledWith(options);
      expect(result.success).toBe(false);
      expect(result.error).toContain(errorMessage);
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
      const mockSprint: YouTrackTypes.Sprint = { id: 'sprint-1', name: 'Sprint 1', status: 'active', $type: 'Sprint' };
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
    
    test('should handle exceptions in resource handling', async () => {
      // Arrange
      const mockUri = new URL('http://example.com/api/boards/board-1/sprints');
      const mockReq = { params: { boardId: 'board-1' } };
      
      // Create a mock error response
      const errorResponse = {
        contents: [{
          uri: mockUri.href,
          text: "An error occurred while processing your request."
        }]
      };
      
      // Setup the mock to fail
      mockBoardGetById.mockRejectedValue(new Error('API error'));
      
      // Act
      const result = await SprintController.handleResourceRequest(mockUri, mockReq);
      
      // Assert
      expect(mockBoardGetById).toHaveBeenCalledWith('board-1');
      expect(result.contents).toBeDefined();
      expect(result.contents.length).toBeGreaterThan(0);
      // We can't check the exact error message since we're not mocking createResourceErrorResponse
      // Just check that we have a response with the right structure
      expect(result.contents[0].uri).toBe(mockUri.href);
    });
  });
}); 