import { jest } from '@jest/globals';
import supertest from 'supertest';
import * as YouTrackTypes from '../../../src/types/youtrack';
import { createTestRequest, createMockServer } from '../../helpers/testHelpers';
import {
  mockIssueGetById as mockGetById,
  mockSearchIssues,
  mockFindByCriteria,
  mockUpdateIssue,
  MockIssue
} from '../../helpers/typedMocks';

// Mock IssueModel
jest.mock('../../../src/models/issue', () => ({
  IssueModel: {
    getById: mockGetById,
    searchIssues: mockSearchIssues,
    findByCriteria: mockFindByCriteria,
    updateIssue: mockUpdateIssue
  }
}));

// Mock MCP Server
let server;
let request: any;

describe('Issue Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock MCP server
    server = createMockServer();
    
    // Add routes
    require('../../../src/routes/issueRoutes').registerIssueRoutes(server);
    
    // Create supertest instance
    request = createTestRequest(server);
  });
  
  describe('GET /api/issues/:issueId', () => {
    test('should return issue details for existing issue', async () => {
      // Arrange
      const mockIssue: MockIssue = {
        id: 'issue-1',
        summary: 'Fix login page',
        description: 'The login page needs styling fixes',
        status: 'Open',
        assignee: { name: 'John Doe' }
      };
      mockGetById.mockResolvedValue(mockIssue);

      // Act
      const response = await request.get('/api/issues/issue-1');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('content');
      expect(response.body.content).toBeInstanceOf(Array);
      expect(response.body.content.length).toBeGreaterThan(0);
      expect(response.body.content[0].type).toBe('text');
      expect(response.body.content[0].text).toContain('issue-1');
      expect(mockGetById).toHaveBeenCalledWith('issue-1');
    });

    test('should return 404 for non-existent issue', async () => {
      // Arrange
      mockGetById.mockResolvedValue(null);

      // Act
      const response = await request.get('/api/issues/non-existent');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('isError', true);
      expect(response.body.content[0].text).toContain('No issue found');
      expect(mockGetById).toHaveBeenCalledWith('non-existent');
    });

    test('should handle internal server error', async () => {
      // Arrange
      mockGetById.mockRejectedValue(new Error('Database error'));

      // Act
      const response = await request.get('/api/issues/issue-1');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('isError', true);
      expect(response.body.content[0].text).toContain('Error fetching issue details');
      expect(mockGetById).toHaveBeenCalledWith('issue-1');
    });
  });

  describe('GET /api/issues/search', () => {
    test('should return matching issues for search query', async () => {
      // Arrange
      const mockIssues: MockIssue[] = [
        { id: 'issue-1', summary: 'Fix login page', status: 'Open' },
        { id: 'issue-2', summary: 'Login page styling', status: 'In Progress' }
      ];
      mockSearchIssues.mockResolvedValue(mockIssues);

      // Act
      const response = await request.get('/api/issues/search')
        .query({ query: 'login page' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('content');
      expect(response.body.content).toBeInstanceOf(Array);
      expect(response.body.content.length).toBeGreaterThan(0);
      expect(response.body.content[0].text).toContain('login page');
      expect(mockSearchIssues).toHaveBeenCalledWith('login page', expect.any(Object));
    });

    test('should handle empty search results', async () => {
      // Arrange
      mockSearchIssues.mockResolvedValue([]);

      // Act
      const response = await request.get('/api/issues/search')
        .query({ query: 'non-existent issue' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('content');
      expect(response.body.content[0].text).toContain('Found 0 issues');
      expect(mockSearchIssues).toHaveBeenCalledWith('non-existent issue', expect.any(Object));
    });
  });
  
  describe('GET /api/issues', () => {
    test('should return issues matching criteria', async () => {
      // Arrange
      const mockIssues: MockIssue[] = [
        { id: 'issue-1', summary: 'Test Issue 1', status: 'Open', assignee: { name: 'John Doe' } },
        { id: 'issue-2', summary: 'Test Issue 2', status: 'Open', assignee: { name: 'John Doe' } }
      ];
      mockFindByCriteria.mockResolvedValue(mockIssues);

      // Act
      const response = await request.get('/api/issues')
        .query({ status: 'Open', assignee: 'John Doe' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('content');
      expect(response.body.content).toBeInstanceOf(Array);
      expect(response.body.content[0].text).toContain('Found');
      expect(mockFindByCriteria).toHaveBeenCalledWith(expect.objectContaining({
        status: 'Open',
        assignee: 'John Doe'
      }));
    });
  });
  
  describe('PATCH /api/issues/:issueId', () => {
    test('should update issue with provided data', async () => {
      // Arrange
      const mockUpdatedIssue: MockIssue = {
        id: 'issue-1',
        summary: 'Updated Issue Title',
        description: 'Updated description',
        status: 'In Progress'
      };
      mockUpdateIssue.mockResolvedValue(mockUpdatedIssue);

      // Act
      const response = await request.patch('/api/issues/issue-1')
        .send({
          summary: 'Updated Issue Title',
          description: 'Updated description',
          status: 'In Progress'
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('content');
      expect(response.body.content[0].text).toContain('successfully updated');
      expect(mockUpdateIssue).toHaveBeenCalledWith('issue-1', expect.objectContaining({
        summary: 'Updated Issue Title',
        description: 'Updated description'
      }));
    });

    test('should handle error during update', async () => {
      // Arrange
      mockUpdateIssue.mockRejectedValue(new Error('Update failed'));

      // Act
      const response = await request.patch('/api/issues/issue-1')
        .send({ status: 'Resolved' });

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('isError', true);
      expect(response.body.content[0].text).toContain('Error updating issue');
      expect(mockUpdateIssue).toHaveBeenCalledWith('issue-1', expect.objectContaining({ 
        resolved: true 
      }));
    });
  });
}); 