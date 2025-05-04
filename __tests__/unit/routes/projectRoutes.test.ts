import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerProjectRoutes } from '../../../src/routes/projectRoutes';
import { ProjectController } from '../../../src/controllers/projectController';
import { ProjectView } from '../../../src/views/projectView';
import { createProjectListResult, createProjectDetailResult, createErrorResult } from '../../helpers/testHelpers';
import { z } from 'zod';
import { PAGINATION_LIMITS, DEFAULT_PAGINATION } from '../../../src/utils/constants';

// Mock the ProjectController and ProjectView
jest.mock('../../../src/controllers/projectController');
jest.mock('../../../src/views/projectView');

// Helper to capture handler function from server.tool mock
const captureHandler = (mockServer: any, toolName: string): ((args: any) => Promise<any>) => {
  const call = mockServer.tool.mock.calls.find((c: any) => c[0] === toolName);
  if (!call || call.length < 4) {
    throw new Error(`Handler for tool '${toolName}' not captured.`);
  }
  return call[3]; // Handler is the 4th argument
};

// Helper to capture the schema definition from server.tool mock
const captureSchema = (mockServer: any, toolName: string): any => {
  const call = mockServer.tool.mock.calls.find((c: any) => c[0] === toolName);
  if (!call || call.length < 3) {
    throw new Error(`Schema for tool '${toolName}' not captured.`);
  }
  return call[2]; // Schema is the 3rd argument
};

describe('Project Routes', () => {
  let server: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock the server
    server = {
      tool: jest.fn(),
      resource: jest.fn()
    };

    // Mock view methods
    (ProjectView.renderList as jest.Mock).mockReturnValue({
      content: [{ type: 'text', text: 'Rendered project list' }]
    });
    
    (ProjectView.renderDetail as jest.Mock).mockReturnValue({
      content: [{ type: 'text', text: 'Rendered project detail' }]
    });
  });
  
  it('should register project routes correctly', () => {
    registerProjectRoutes(server);
    expect(server.tool).toHaveBeenCalledWith(
      'youtrack_list_projects',
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
    expect(server.tool).toHaveBeenCalledWith(
      'youtrack_find_projects_by_name',
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
    expect(server.resource).toHaveBeenCalled();
  });

  describe('list_projects handler', () => {
    it('should call ProjectController.listProjects and render the result', async () => {
      const mockProjects = createProjectListResult([
        { id: 'p1', name: 'Project 1', shortName: 'P1', $type: 'Project' }
      ]);
      (ProjectController.listProjects as jest.Mock).mockResolvedValue(mockProjects);

      registerProjectRoutes(server);
      const handler = captureHandler(server, 'youtrack_list_projects');
      const result = await handler({ limit: 10, skip: 0 });

      expect(ProjectController.listProjects).toHaveBeenCalledWith({ limit: 10, skip: 0 });
      expect(ProjectView.renderList).toHaveBeenCalledWith(mockProjects);
      expect(result).toEqual({ content: [{ type: 'text', text: 'Rendered project list' }] });
    });

    it('should handle error results', async () => {
      const mockError = createErrorResult('Failed to list projects');
      (ProjectController.listProjects as jest.Mock).mockResolvedValue(mockError);

      registerProjectRoutes(server);
      const handler = captureHandler(server, 'youtrack_list_projects');
      const result = await handler({ limit: 10, skip: 0 });

      expect(ProjectController.listProjects).toHaveBeenCalledWith({ limit: 10, skip: 0 });
      expect(ProjectView.renderList).toHaveBeenCalledWith(mockError);
      expect(result).toEqual({ content: [{ type: 'text', text: 'Rendered project list' }] });
    });
  });

  describe('find_projects_by_name handler', () => {
    it('should call ProjectController.findProjectsByName and render the result', async () => {
      const mockProjects = createProjectListResult([
        { id: 'p1', name: 'Test Project', shortName: 'TP', $type: 'Project' }
      ]);
      (ProjectController.findProjectsByName as jest.Mock).mockResolvedValue(mockProjects);

      registerProjectRoutes(server);
      const handler = captureHandler(server, 'youtrack_find_projects_by_name');
      const result = await handler({ name: 'Test', limit: 10, skip: 0 });

      expect(ProjectController.findProjectsByName).toHaveBeenCalledWith('Test', { limit: 10, skip: 0 });
      expect(ProjectView.renderList).toHaveBeenCalledWith(mockProjects);
      expect(result).toEqual({ content: [{ type: 'text', text: 'Rendered project list' }] });
    });

    it('should handle error results', async () => {
      const mockError = createErrorResult('Failed to find projects');
      (ProjectController.findProjectsByName as jest.Mock).mockResolvedValue(mockError);

      registerProjectRoutes(server);
      const handler = captureHandler(server, 'youtrack_find_projects_by_name');
      const result = await handler({ name: 'Test', limit: 10, skip: 0 });

      expect(ProjectController.findProjectsByName).toHaveBeenCalledWith('Test', { limit: 10, skip: 0 });
      expect(ProjectView.renderList).toHaveBeenCalledWith(mockError);
      expect(result).toEqual({ content: [{ type: 'text', text: 'Rendered project list' }] });
    });
  });

  // Direct tests of the transformation functions
  describe('projectRoutes transform functions', () => {
    // Define transform functions to match actual implementation
    const limitTransform = (val?: number) => 
      val === undefined || val <= 0 ? DEFAULT_PAGINATION.LIMIT : Math.min(Math.max(val, 1), PAGINATION_LIMITS.PROJECTS);
    
    const skipTransform = (val?: number) => 
      Math.max(val || DEFAULT_PAGINATION.SKIP, 0);
    
    it('should test schema transformations directly', () => {
      registerProjectRoutes(server);
      const schema = captureSchema(server, 'youtrack_list_projects');
      
      // Extract transform functions from schema
      const limitSchema = schema.limit;
      const skipSchema = schema.skip;
      
      // Test limit transform
      expect(limitSchema.parse(undefined)).toBe(DEFAULT_PAGINATION.LIMIT);
      expect(limitSchema.parse(0)).toBe(DEFAULT_PAGINATION.LIMIT);
      expect(limitSchema.parse(-5)).toBe(DEFAULT_PAGINATION.LIMIT);
      expect(limitSchema.parse(10)).toBe(10);
      expect(limitSchema.parse(1000)).toBe(PAGINATION_LIMITS.PROJECTS);
      
      // Test skip transform
      expect(skipSchema.parse(undefined)).toBe(DEFAULT_PAGINATION.SKIP);
      expect(skipSchema.parse(-10)).toBe(0);
      expect(skipSchema.parse(20)).toBe(20);
    });
    
    it('should test limit transform function branches', () => {
      // Test with undefined (should use default)
      expect(limitTransform(undefined)).toBe(DEFAULT_PAGINATION.LIMIT);
      
      // Test with zero (should use default)
      expect(limitTransform(0)).toBe(DEFAULT_PAGINATION.LIMIT);
      
      // Test with negative value (should use default)
      expect(limitTransform(-5)).toBe(DEFAULT_PAGINATION.LIMIT);
      
      // Test with valid value within range
      expect(limitTransform(10)).toBe(10);
      
      // Test with value less than min (should use min of 1)
      expect(limitTransform(0.5)).toBe(1);
      
      // Test with value above max (should use max)
      expect(limitTransform(PAGINATION_LIMITS.PROJECTS + 10)).toBe(PAGINATION_LIMITS.PROJECTS);
    });
    
    it('should test skip transform function branches', () => {
      // Test with undefined (should use default)
      expect(skipTransform(undefined)).toBe(DEFAULT_PAGINATION.SKIP);
      
      // Test with negative value (should use 0)
      expect(skipTransform(-5)).toBe(0);
      
      // Test with valid value
      expect(skipTransform(20)).toBe(20);
      
      // Test with zero
      expect(skipTransform(0)).toBe(0);
    });
    
    // Test schema for find_projects_by_name
    it('should test schema transformations for find_projects_by_name', () => {
      registerProjectRoutes(server);
      const schema = captureSchema(server, 'youtrack_find_projects_by_name');
      
      // Extract transform functions from schema
      const limitSchema = schema.limit;
      const skipSchema = schema.skip;
      const nameSchema = schema.name;
      
      // Test limit transform
      expect(limitSchema.parse(undefined)).toBe(DEFAULT_PAGINATION.LIMIT);
      expect(limitSchema.parse(0)).toBe(DEFAULT_PAGINATION.LIMIT);
      expect(limitSchema.parse(100)).toBe(PAGINATION_LIMITS.PROJECTS);
      
      // Test skip transform
      expect(skipSchema.parse(undefined)).toBe(DEFAULT_PAGINATION.SKIP);
      expect(skipSchema.parse(-10)).toBe(0);
      
      // Test name field
      expect(nameSchema.parse('Test')).toBe('Test');
    });
  });
}); 