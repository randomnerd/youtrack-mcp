import { jest } from '@jest/globals';
import supertest from 'supertest';
import * as YouTrackTypes from '../../../src/types/youtrack';
import { createTestRequest, createMockServer } from '../../helpers/testHelpers';
import { mockProjectGetAll as mockGetAll } from '../../helpers/typedMocks';

// Mock ProjectModel
jest.mock('../../../src/models/project', () => ({
  ProjectModel: {
    getAll: mockGetAll
  }
}));

// Mock MCP Server
let server;
let request: any;

describe('Project Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock MCP server
    server = createMockServer();
    
    // Add routes
    require('../../../src/routes/projectRoutes').registerProjectRoutes(server);
    
    // Create supertest instance
    request = createTestRequest(server);
  });
  
  describe('GET /api/projects', () => {
    test('should return list of all projects', async () => {
      // Arrange
      const mockProjects: YouTrackTypes.Project[] = [
        { id: 'project-1', name: 'Project 1', shortName: 'P1', description: 'Test Project 1', $type: 'Project' },
        { id: 'project-2', name: 'Project 2', shortName: 'P2', description: 'Test Project 2', $type: 'Project' }
      ];
      mockGetAll.mockResolvedValue(mockProjects);

      // Act
      const response = await request.get('/api/projects');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, data: mockProjects });
      expect(mockGetAll).toHaveBeenCalled();
    });

    test('should handle empty projects list', async () => {
      // Arrange
      mockGetAll.mockResolvedValue([]);

      // Act
      const response = await request.get('/api/projects');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, data: [] });
      expect(mockGetAll).toHaveBeenCalled();
    });

    test('should handle error when fetching projects', async () => {
      // Arrange
      mockGetAll.mockRejectedValue(new Error('Database error'));

      // Act
      const response = await request.get('/api/projects');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
      expect(mockGetAll).toHaveBeenCalled();
    });
  });
}); 