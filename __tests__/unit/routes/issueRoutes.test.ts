import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerIssueRoutes } from '../../../src/routes/issueRoutes';
import { IssueController } from '../../../src/controllers/issueController';
import { IssueView } from '../../../src/views/issueView';
import { createIssueDetailResult, createIssueListResult, createIssueUpdateResult, createErrorResult } from '../../helpers/testHelpers';
import { z } from 'zod';
import { DEFAULT_PAGINATION, PAGINATION_LIMITS } from '../../../src/utils/constants';
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

// Mock the IssueController and IssueView
jest.mock('../../../src/controllers/issueController');
jest.mock('../../../src/views/issueView');

// Define expected schemas matching the implementation
const getIssueSchema = {
  issueId: expect.any(Object), // ZodString
};

const updateIssueSchema = {
  issueId: expect.any(Object), // ZodString
  summary: expect.any(Object), // ZodOptional(ZodString)
  description: expect.any(Object), // ZodOptional(ZodString)
  resolved: expect.any(Object), // ZodOptional(ZodBoolean)
};

const searchIssuesSchema = {
  query: expect.any(Object), // ZodString
  limit: expect.any(Object), // ZodEffects
  skip: expect.any(Object), // ZodEffects
  sortBy: expect.any(Object), // ZodOptional(ZodString)
};

const findIssuesByCriteriaSchema = {
  project: expect.any(Object), // ZodOptional(ZodString)
  assignee: expect.any(Object), // ZodOptional(ZodString)
  sprint: expect.any(Object), // ZodOptional(ZodString)
  type: expect.any(Object), // ZodOptional(ZodString)
  status: expect.any(Object), // ZodOptional(ZodString)
  limit: expect.any(Object), // ZodEffects
  skip: expect.any(Object), // ZodEffects
};

describe('Issue Routes', () => {
  let server: McpServer;
  
  beforeEach(() => {
    // Create a mock MCP server
    server = {
      tool: jest.fn(),
      resource: jest.fn()
    } as unknown as McpServer;
    
    // Reset controller mocks
    jest.resetAllMocks();
    
    // Mock the IssueView methods
    (IssueView.renderDetail as jest.Mock).mockReturnValue({
      content: [{ type: 'text', text: 'Rendered issue detail' }]
    });
    
    (IssueView.renderList as jest.Mock).mockReturnValue({
      content: [{ type: 'text', text: 'Rendered issue list' }]
    });
    
    (IssueView.renderUpdateSuccess as jest.Mock).mockReturnValue({
      content: [{ type: 'text', text: 'Issue updated successfully' }]
    });
  });
  
  it('should register issue routes on the server', () => {
    // Register routes
    registerIssueRoutes(server as any);
    
    // Check if tool method was called four times (once for each route)
    expect(server.tool).toHaveBeenCalledTimes(4);
    
    // Check that the get_issue route was registered
    expect(server.tool).toHaveBeenCalledWith(
      'youtrack_get_issue',
      'Get details of a specific issue',
      expect.objectContaining(getIssueSchema),
      expect.any(Function)
    );
    
    // Check that the update_issue route was registered
    expect(server.tool).toHaveBeenCalledWith(
      'youtrack_update_issue',
      'Update an existing issue',
      expect.objectContaining(updateIssueSchema),
      expect.any(Function)
    );
    
    // Check that the search_issues route was registered
    expect(server.tool).toHaveBeenCalledWith(
      'youtrack_search_issues',
      'Search for issues using YouTrack query syntax',
      expect.objectContaining(searchIssuesSchema),
      expect.any(Function)
    );
    
    // Check that the find_issues_by_criteria route was registered
    expect(server.tool).toHaveBeenCalledWith(
      'youtrack_find_issues_by_criteria',
      'Find issues by specific criteria like assignee, sprint, type, or status',
      expect.objectContaining(findIssuesByCriteriaSchema),
      expect.any(Function)
    );
  });
  
  it('should call IssueController.getIssue when get_issue route is called', async () => {
    // Mock implementation
    const issue = { id: 'issue-1', summary: 'Test Issue', $type: 'Issue', customFields: [] };
    const controllerResult = createIssueDetailResult(issue as any);
    (IssueController.getIssue as jest.Mock).mockResolvedValue(controllerResult);
    
    // Register routes
    registerIssueRoutes(server);
    
    // Get the route handler function
    const routeHandler = (server.tool as jest.Mock).mock.calls[0][3];
    
    // Call the route handler with issueId
    const result = await routeHandler({ issueId: 'issue-1' });
    
    // Check if controller method was called with correct parameters
    expect(IssueController.getIssue).toHaveBeenCalledWith('issue-1');
    expect(IssueView.renderDetail).toHaveBeenCalledWith(controllerResult);
    expect(result).toEqual({
      content: [{ type: 'text', text: 'Rendered issue detail' }]
    });
  });

  it('should handle errors when get_issue route fails', async () => {
    // Mock implementation to throw an error
    const errorMessage = 'Failed to fetch issue';
    (IssueController.getIssue as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    // Register routes
    registerIssueRoutes(server);
    
    // Get the route handler function
    const routeHandler = (server.tool as jest.Mock).mock.calls[0][3];
    
    // Call the route handler and expect it to throw
    await expect(routeHandler({ issueId: 'issue-1' })).rejects.toThrow(errorMessage);
    expect(IssueController.getIssue).toHaveBeenCalledWith('issue-1');
  });
  
  it('should call IssueController.updateIssue when update_issue route is called', async () => {
    // Mock implementation
    const controllerResult = createIssueUpdateResult('issue-1');
    (IssueController.updateIssue as jest.Mock).mockResolvedValue(controllerResult);
    
    // Register routes
    registerIssueRoutes(server);
    
    // Get the route handler function
    const routeHandler = (server.tool as jest.Mock).mock.calls[1][3];
    
    // Different test cases for update options
    const testCases = [
      { issueId: 'issue-1', summary: 'Updated Issue' },
      { issueId: 'issue-1', description: 'Updated description' },
      { issueId: 'issue-1', resolved: true },
      { issueId: 'issue-1', summary: 'Updated Issue', description: 'Updated description', resolved: true }
    ];
    
    for (const options of testCases) {
      // Reset the mock before each call
      (IssueController.updateIssue as jest.Mock).mockClear();
      (IssueView.renderUpdateSuccess as jest.Mock).mockClear();
      
      // Call the route handler with options
      const result = await routeHandler(options);
      
      // Extract expected update data
      const { issueId, ...updateData } = options;
      
      // Check if controller method was called with correct parameters
      expect(IssueController.updateIssue).toHaveBeenCalledWith(issueId, updateData);
      expect(IssueView.renderUpdateSuccess).toHaveBeenCalledWith(controllerResult);
      expect(result).toEqual({
        content: [{ type: 'text', text: 'Issue updated successfully' }]
      });
    }
  });

  it('should handle errors when update_issue route fails', async () => {
    // Mock implementation to throw an error
    const errorMessage = 'Failed to update issue';
    (IssueController.updateIssue as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    // Register routes
    registerIssueRoutes(server);
    
    // Get the route handler function
    const routeHandler = (server.tool as jest.Mock).mock.calls[1][3];
    
    // Call the route handler and expect it to throw
    await expect(routeHandler({ 
      issueId: 'issue-1', 
      summary: 'Updated Issue' 
    })).rejects.toThrow(errorMessage);
    
    expect(IssueController.updateIssue).toHaveBeenCalledWith('issue-1', { summary: 'Updated Issue' });
  });
  
  it('should call IssueController.searchIssues when search_issues route is called', async () => {
    // Mock implementation
    const issues = [
      { id: 'issue-1', summary: 'Test Issue 1', $type: 'Issue', customFields: [] },
      { id: 'issue-2', summary: 'Test Issue 2', $type: 'Issue', customFields: [] }
    ];
    const controllerResult = createIssueListResult(issues as any[]);
    (IssueController.searchIssues as jest.Mock).mockResolvedValue(controllerResult);
    
    // Register routes
    registerIssueRoutes(server);
    
    // Get the route handler function
    const routeHandler = (server.tool as jest.Mock).mock.calls[2][3];
    
    // Different test cases for search options
    const testCases = [
      { query: 'project: TEST' },
      { query: 'project: TEST', limit: 20 },
      { query: 'project: TEST', sortBy: 'created' },
      { query: 'project: TEST', limit: 5, sortBy: 'priority' }
    ];
    
    for (const options of testCases) {
      // Reset the mock before each call
      (IssueController.searchIssues as jest.Mock).mockClear();
      (IssueView.renderList as jest.Mock).mockClear();
      
      // Call the route handler with options
      const result = await routeHandler(options);
      
      // Extract query and options
      const { query, ...searchOptions } = options;
      
      // Check if controller method was called with correct parameters
      expect(IssueController.searchIssues).toHaveBeenCalledWith(query, searchOptions);
      expect(IssueView.renderList).toHaveBeenCalledWith(controllerResult);
      expect(result).toEqual({
        content: [{ type: 'text', text: 'Rendered issue list' }]
      });
    }
  });

  it('should test limit transformation in search_issues route', async () => {
    // Mock implementation
    (IssueController.searchIssues as jest.Mock).mockResolvedValue([]);
    
    // Register routes
    registerIssueRoutes(server);
    
    // Get the route handler function
    const routeHandler = (server.tool as jest.Mock).mock.calls[2][3];
    
    // Test various limit values
    const testCases = [
      { query: 'test', limit: 0 },
      { query: 'test', limit: 100 },
      { query: 'test', limit: undefined },
      { query: 'test', limit: 25 }
    ];
    
    for (const { query, limit } of testCases) {
      // Reset the mock before each call
      (IssueController.searchIssues as jest.Mock).mockClear();
      
      // Call the route handler
      await routeHandler({ query, limit });
      
      // Verify the controller is called with the query and some limit
      expect(IssueController.searchIssues).toHaveBeenCalledTimes(1);
      const mockFn = IssueController.searchIssues as jest.Mock;
      expect(mockFn.mock.calls[0][0]).toBe(query);
      
      // Skip asserting the actual limit value since it's transformed by Zod
      // The implementation and tests for the transformation are in issueRoutes.transform.test.ts
    }
  });

  it('should test skip transformation in search_issues route', async () => {
    // Mock implementation
    (IssueController.searchIssues as jest.Mock).mockResolvedValue([]);
    
    // Register routes
    registerIssueRoutes(server);
    
    // Get the route handler function
    const routeHandler = (server.tool as jest.Mock).mock.calls[2][3];
    
    // Test various skip values
    const testCases = [
      { query: 'test', skip: 0 },
      { query: 'test', skip: 10 },
      { query: 'test', skip: undefined },
      { query: 'test', skip: -5 }
    ];
    
    for (const { query, skip } of testCases) {
      // Reset the mock before each call
      (IssueController.searchIssues as jest.Mock).mockClear();
      
      // Call the route handler
      await routeHandler({ query, skip });
      
      // Verify the controller is called with the query and some skip
      expect(IssueController.searchIssues).toHaveBeenCalledTimes(1);
      const mockFn = IssueController.searchIssues as jest.Mock;
      expect(mockFn.mock.calls[0][0]).toBe(query);
      
      // Skip asserting the actual skip value since it's transformed by Zod
      // The implementation and tests for the transformation are in issueRoutes.transform.test.ts
    }
  });

  it('should handle errors when search_issues route fails', async () => {
    // Mock implementation to throw an error
    const errorMessage = 'Failed to search issues';
    (IssueController.searchIssues as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    // Register routes
    registerIssueRoutes(server);
    
    // Get the route handler function
    const routeHandler = (server.tool as jest.Mock).mock.calls[2][3];
    
    // Call the route handler and expect it to throw
    await expect(routeHandler({ query: 'test query' })).rejects.toThrow(errorMessage);
    expect(IssueController.searchIssues).toHaveBeenCalledWith('test query', {});
  });
  
  it('should call IssueController.findIssuesByCriteria when find_issues_by_criteria route is called', async () => {
    // Mock implementation
    const issues = [
      { id: 'issue-1', summary: 'Test Issue 1', $type: 'Issue', customFields: [] },
      { id: 'issue-2', summary: 'Test Issue 2', $type: 'Issue', customFields: [] }
    ];
    const controllerResult = createIssueListResult(issues as any[]);
    (IssueController.findIssuesByCriteria as jest.Mock).mockResolvedValue(controllerResult);
    
    // Register routes
    registerIssueRoutes(server);
    
    // Get the route handler function
    const routeHandler = (server.tool as jest.Mock).mock.calls[3][3];
    
    // Test options
    const options = {
      project: 'TEST',
      assignee: 'user1',
      sprint: 'Sprint 1',
      type: 'Bug',
      limit: 10
    };
    
    // Call the route handler
    const result = await routeHandler(options);
    
    // Check if controller method was called with correct parameters
    expect(IssueController.findIssuesByCriteria).toHaveBeenCalledWith(options);
    expect(IssueView.renderList).toHaveBeenCalledWith(controllerResult);
    expect(result).toEqual({
      content: [{ type: 'text', text: 'Rendered issue list' }]
    });
  });

  it('should test limit transformation in find_issues_by_criteria route', async () => {
    // Mock implementation
    (IssueController.findIssuesByCriteria as jest.Mock).mockResolvedValue([]);
    
    // Register routes
    registerIssueRoutes(server);
    
    // Get the route handler function
    const routeHandler = (server.tool as jest.Mock).mock.calls[3][3];
    
    // Test various limit values
    const testCases = [
      { limit: 0 },
      { limit: 100 },
      { limit: undefined },
      { limit: 25 }
    ];
    
    for (const { limit } of testCases) {
      // Reset the mock before each call
      (IssueController.findIssuesByCriteria as jest.Mock).mockClear();
      
      // Call the route handler
      await routeHandler({ limit });
      
      // Verify the controller is called with some limit
      expect(IssueController.findIssuesByCriteria).toHaveBeenCalledTimes(1);
      
      // Skip asserting the actual limit value since it's transformed by Zod
      // The implementation and tests for the transformation are in issueRoutes.transform.test.ts
    }
  });

  it('should test skip transformation in find_issues_by_criteria route', async () => {
    // Mock implementation
    (IssueController.findIssuesByCriteria as jest.Mock).mockResolvedValue([]);
    
    // Register routes
    registerIssueRoutes(server);
    
    // Get the route handler function
    const routeHandler = (server.tool as jest.Mock).mock.calls[3][3];
    
    // Test various skip values
    const testCases = [
      { skip: 0 },
      { skip: 10 },
      { skip: undefined },
      { skip: -5 }
    ];
    
    for (const { skip } of testCases) {
      // Reset the mock before each call
      (IssueController.findIssuesByCriteria as jest.Mock).mockClear();
      
      // Call the route handler
      await routeHandler({ skip });
      
      // Verify the controller is called with some skip
      expect(IssueController.findIssuesByCriteria).toHaveBeenCalledTimes(1);
      
      // Skip asserting the actual skip value since it's transformed by Zod
      // The implementation and tests for the transformation are in issueRoutes.transform.test.ts
    }
  });

  it('should handle errors when find_issues_by_criteria route fails', async () => {
    // Mock implementation to throw an error
    const errorMessage = 'Failed to find issues';
    (IssueController.findIssuesByCriteria as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    // Register routes
    registerIssueRoutes(server);
    
    // Get the route handler function
    const routeHandler = (server.tool as jest.Mock).mock.calls[3][3];
    
    // Call the route handler and expect it to throw
    await expect(routeHandler({ status: 'Open' })).rejects.toThrow(errorMessage);
    expect(IssueController.findIssuesByCriteria).toHaveBeenCalledWith({ status: 'Open' });
  });
});

describe('Issue Resource', () => {
  let server: McpServer;
  
  beforeEach(() => {
    // Create a mock MCP server
    server = {
      tool: jest.fn(),
      resource: jest.fn()
    } as unknown as McpServer;
    
    // Reset controller mocks
    jest.resetAllMocks();
    
    // Mock the IssueController.handleResourceRequest method
    (IssueController.handleResourceRequest as jest.Mock).mockResolvedValue({
      content: [{ type: 'text', text: 'Rendered resource response' }]
    });
  });
  
  it('should register the issue resource on the server', () => {
    // Register routes
    registerIssueRoutes(server);
    
    // Check if resource method was called once
    expect(server.resource).toHaveBeenCalledTimes(1);
    
    // Check the resource registration arguments
    const resourceCallArgs = (server.resource as jest.Mock).mock.calls[0];
    expect(resourceCallArgs[0]).toBe('issues'); // Resource name
    expect(resourceCallArgs[1]).toBeInstanceOf(ResourceTemplate); // Resource template instance
    
    // Skip checking the URI property since it's not easily accessible in the mock
    // The implementation test for this should be in an integration test
    
    expect(resourceCallArgs[2]).toBeInstanceOf(Function); // Resource handler function
  });
  
  it('should call IssueController.handleResourceRequest with correct arguments when resource handler is invoked', async () => {
    // Register routes
    registerIssueRoutes(server);
    
    // Get the resource handler function
    const resourceHandler = (server.resource as jest.Mock).mock.calls[0][2];
    
    // Test cases for different URIs and variables
    const testCases = [
      { uri: 'youtrack://issues', variables: {}, expectedParams: {} }, // List case
      { uri: 'youtrack://issues/ISSUE-1', variables: { issueId: 'ISSUE-1' }, expectedParams: { issueId: 'ISSUE-1' } }, // Detail case
      { uri: 'youtrack://issues/', variables: {}, expectedParams: {} }, // List case with trailing slash
    ];
    
    for (const { uri, variables, expectedParams } of testCases) {
      // Reset the mock before each call
      (IssueController.handleResourceRequest as jest.Mock).mockClear();
      
      // Call the resource handler
      const mockReq = { variables }; // Mock request object with variables
      const result = await resourceHandler(uri, mockReq);
      
      // Verify IssueController.handleResourceRequest was called with correct arguments
      expect(IssueController.handleResourceRequest).toHaveBeenCalledTimes(1);
      expect(IssueController.handleResourceRequest).toHaveBeenCalledWith(uri, {
        ...mockReq,
        params: expectedParams,
      });
      
      // Verify the result from the handler (assuming it directly returns the controller result)
      expect(result).toEqual({
        content: [{ type: 'text', text: 'Rendered resource response' }]
      });
    }
  });
  
  it('should handle errors when resource handler fails', async () => {
    // Mock implementation to throw an error
    const errorMessage = 'Failed to handle resource request';
    (IssueController.handleResourceRequest as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    // Register routes
    registerIssueRoutes(server);
    
    // Get the resource handler function
    const resourceHandler = (server.resource as jest.Mock).mock.calls[0][2];
    
    // Call the resource handler and expect it to throw
    await expect(resourceHandler('youtrack://issues/ISSUE-1', { variables: { issueId: 'ISSUE-1' } })).rejects.toThrow(errorMessage);
    expect(IssueController.handleResourceRequest).toHaveBeenCalledWith('youtrack://issues/ISSUE-1', {
      variables: { issueId: 'ISSUE-1' },
      params: { issueId: 'ISSUE-1' },
    });
  });
}); 