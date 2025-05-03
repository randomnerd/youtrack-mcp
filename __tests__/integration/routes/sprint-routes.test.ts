import { jest } from '@jest/globals';
import supertest from 'supertest';
import * as YouTrackTypes from '../../../src/types/youtrack';
import { createTestRequest, createMockServer } from '../../helpers/testHelpers';
import {
  mockGetById,
  mockFindSprints,
  MockSprint
} from '../../helpers/typedMocks';

// Mock SprintModel
jest.mock('../../../src/models/sprint', () => ({
  SprintModel: {
    getById: mockGetById,
    findSprints: mockFindSprints
  }
}));

// Mock MCP Server
let server;
let request: any;

describe('Sprint Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock MCP server
    server = createMockServer();
    
    // Add routes
    require('../../../src/routes/sprintRoutes').registerSprintRoutes(server);
    
    // Create supertest instance
    request = createTestRequest(server);
  });

  describe('GET /api/boards/:boardId/sprints/:sprintId', () => {
    test('should return sprint details for valid sprint ID', async () => {
      // Arrange
      const mockSprint = {
        id: 'sprint-1',
        name: 'Sprint 1',
        startDate: '2023-01-01',
        endDate: '2023-01-14',
        status: 'active',
        $type: 'Sprint' as const
      };
      mockGetById.mockResolvedValue(mockSprint);

      // Act
      const response = await request.get('/api/boards/board-1/sprints/sprint-1');

      // Assert
      expect(response.status).toBe(200);
      expect(mockGetById).toHaveBeenCalledWith('board-1', 'sprint-1');
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', 'sprint-1');
    });

    test('should return 404 for non-existent sprint', async () => {
      // Arrange
      mockGetById.mockResolvedValue(null);

      // Act
      const response = await request.get('/api/boards/board-1/sprints/non-existent');

      // Assert
      expect(response.status).toBe(404);
      expect(mockGetById).toHaveBeenCalledWith('board-1', 'non-existent');
      expect(response.body).toEqual({ error: 'Sprint not found' });
    });

    test('should handle internal server error', async () => {
      // Arrange
      mockGetById.mockRejectedValue(new Error('Database error'));

      // Act
      const response = await request.get('/api/boards/board-1/sprints/sprint-1');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });
  });

  describe('GET /api/sprints', () => {
    test('should return sprints filtered by provided criteria', async () => {
      // Arrange
      const mockSprints = [
        { id: 'sprint-1', name: 'Sprint 1', status: 'active', $type: 'Sprint' as const },
        { id: 'sprint-2', name: 'Sprint 2', status: 'active', $type: 'Sprint' as const }
      ];
      mockFindSprints.mockResolvedValue(mockSprints);

      // Act
      const response = await request.get('/api/sprints')
        .query({ boardId: 'board-1', status: 'active' });

      // Assert
      expect(response.status).toBe(200);
      expect(mockFindSprints).toHaveBeenCalledWith(expect.objectContaining({
        boardId: 'board-1',
        status: 'active'
      }));
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveLength(2);
    });

    test('should handle empty search results', async () => {
      // Arrange
      mockFindSprints.mockResolvedValue([]);

      // Act
      const response = await request.get('/api/sprints')
        .query({ sprintName: 'Non-existent Sprint' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveLength(0);
    });

    test('should handle error during search', async () => {
      // Arrange
      mockFindSprints.mockRejectedValue(new Error('Search error'));

      // Act
      const response = await request.get('/api/sprints');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });
  });
}); 