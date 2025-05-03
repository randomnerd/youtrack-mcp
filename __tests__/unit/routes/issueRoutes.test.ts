import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerIssueRoutes } from '../../../src/routes/issueRoutes';
import { IssueController } from '../../../src/controllers/issueController';

// Mock the IssueController
jest.mock('../../../src/controllers/issueController');

describe('Issue Routes', () => {
  let server: McpServer;
  
  beforeEach(() => {
    // Create a mock MCP server
    server = {
      tool: jest.fn(),
    } as unknown as McpServer;
    
    // Reset controller mocks
    jest.resetAllMocks();
  });
  
  it('should register issue routes on the server', () => {
    // Register routes
    registerIssueRoutes(server);
    
    // Check if tool method was called four times (once for each route)
    expect(server.tool).toHaveBeenCalledTimes(4);
    
    // Check that the get_issue route was registered
    expect(server.tool).toHaveBeenCalledWith(
      'youtrack_get_issue',
      'Get details of a specific issue',
      {
        issueId: expect.any(Object)
      },
      expect.any(Function)
    );
    
    // Check that the update_issue route was registered
    expect(server.tool).toHaveBeenCalledWith(
      'youtrack_update_issue',
      'Update an existing issue',
      {
        issueId: expect.any(Object),
        summary: expect.any(Object),
        description: expect.any(Object),
        resolved: expect.any(Object)
      },
      expect.any(Function)
    );
    
    // Check that the search_issues route was registered
    expect(server.tool).toHaveBeenCalledWith(
      'youtrack_search_issues',
      'Search for issues using YouTrack query syntax',
      {
        query: expect.any(Object),
        limit: expect.any(Object),
        sortBy: expect.any(Object)
      },
      expect.any(Function)
    );
    
    // Check that the find_issues_by_criteria route was registered
    expect(server.tool).toHaveBeenCalledWith(
      'youtrack_find_issues_by_criteria',
      'Find issues by specific criteria like assignee, sprint, type, or status',
      {
        project: expect.any(Object),
        assignee: expect.any(Object),
        sprint: expect.any(Object),
        type: expect.any(Object),
        status: expect.any(Object),
        limit: expect.any(Object)
      },
      expect.any(Function)
    );
  });
  
  it('should call IssueController.getIssue when get_issue route is called', async () => {
    // Mock implementation
    (IssueController.getIssue as jest.Mock).mockResolvedValue(
      { id: 'issue-1', summary: 'Test Issue' }
    );
    
    // Register routes
    registerIssueRoutes(server);
    
    // Get the route handler function
    const routeHandler = (server.tool as jest.Mock).mock.calls[0][3];
    
    // Call the route handler with issueId
    const result = await routeHandler({ issueId: 'issue-1' });
    
    // Check if controller method was called with correct parameters
    expect(IssueController.getIssue).toHaveBeenCalledWith('issue-1');
    expect(result).toEqual({ id: 'issue-1', summary: 'Test Issue' });
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
    (IssueController.updateIssue as jest.Mock).mockResolvedValue(
      { id: 'issue-1', summary: 'Updated Issue', description: 'Updated description', resolved: true }
    );
    
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
      
      // Call the route handler with options
      const result = await routeHandler(options);
      
      // Extract expected update data
      const { issueId, ...updateData } = options;
      
      // Check if controller method was called with correct parameters
      expect(IssueController.updateIssue).toHaveBeenCalledWith(issueId, updateData);
      expect(result).toEqual({ 
        id: 'issue-1', 
        summary: 'Updated Issue', 
        description: 'Updated description', 
        resolved: true 
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
    (IssueController.searchIssues as jest.Mock).mockResolvedValue([
      { id: 'issue-1', summary: 'Test Issue 1' },
      { id: 'issue-2', summary: 'Test Issue 2' }
    ]);
    
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
      
      // Call the route handler with options
      const result = await routeHandler(options);
      
      // Extract query and options
      const { query, ...searchOptions } = options;
      
      // Check if controller method was called with correct parameters
      expect(IssueController.searchIssues).toHaveBeenCalledWith(query, searchOptions);
      expect(result).toEqual([
        { id: 'issue-1', summary: 'Test Issue 1' },
        { id: 'issue-2', summary: 'Test Issue 2' }
      ]);
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
      expect(mockFn.mock.calls[0][1]).toHaveProperty('limit');
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
    (IssueController.findIssuesByCriteria as jest.Mock).mockResolvedValue([
      { id: 'issue-1', summary: 'Test Issue 1' },
      { id: 'issue-2', summary: 'Test Issue 2' }
    ]);
    
    // Register routes
    registerIssueRoutes(server);
    
    // Get the route handler function
    const routeHandler = (server.tool as jest.Mock).mock.calls[3][3];
    
    // Different test cases for criteria options
    const testCases = [
      { project: 'TEST' },
      { assignee: 'me' },
      { sprint: 'Sprint 1' },
      { type: 'Bug' },
      { status: 'Open' },
      { limit: 15 },
      { project: 'TEST', assignee: 'me', sprint: 'Sprint 1', type: 'Bug', status: 'Open', limit: 10 }
    ];
    
    for (const options of testCases) {
      // Reset the mock before each call
      (IssueController.findIssuesByCriteria as jest.Mock).mockClear();
      
      // Call the route handler with options
      const result = await routeHandler(options);
      
      // Check if controller method was called with correct parameters
      expect(IssueController.findIssuesByCriteria).toHaveBeenCalledWith(options);
      expect(result).toEqual([
        { id: 'issue-1', summary: 'Test Issue 1' },
        { id: 'issue-2', summary: 'Test Issue 2' }
      ]);
    }
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
      { project: 'TEST', limit: 0 },
      { project: 'TEST', limit: 100 },
      { project: 'TEST', limit: undefined },
      { project: 'TEST', limit: 25 }
    ];
    
    for (const { project, limit } of testCases) {
      // Reset the mock before each call
      (IssueController.findIssuesByCriteria as jest.Mock).mockClear();
      
      // Call the route handler
      await routeHandler({ project, limit });
      
      // Verify the controller is called with the project and some limit
      expect(IssueController.findIssuesByCriteria).toHaveBeenCalledTimes(1);
      const mockFn = IssueController.findIssuesByCriteria as jest.Mock;
      const calledOptions = mockFn.mock.calls[0][0];
      expect(calledOptions).toHaveProperty('project', project);
      expect(calledOptions).toHaveProperty('limit');
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