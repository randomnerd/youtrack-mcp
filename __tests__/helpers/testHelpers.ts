import supertest from 'supertest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import express from 'express';
import { jest } from '@jest/globals';
import {
  mockGetById,
  mockGetSprintIssues,
  mockFindSprints,
  mockBoardGetById,
  mockRenderError,
  mockRenderDetail,
  mockRenderList,
  mockHandleResourceRequest,
  mockIssueGetById,
  mockSearchIssues,
  mockFindByCriteria,
  mockUpdateIssue,
  mockProjectGetAll
} from './typedMocks';
import * as YouTrackTypes from '../../src/types/youtrack';
import { 
  ControllerResult, 
  ProjectDetailResult, 
  ProjectListResult,
  IssueDetailResult,
  IssueListResult,
  IssueUpdateResult,
  BoardDetailResult,
  BoardListResult,
  SprintDetailResult,
  SprintListResult
} from '../../src/types/controllerResults';

// Helper function to create a supertest instance from an MCP server
// This handles the TypeScript type issues by casting
export function createTestRequest(server: McpServer): any {
  // Force cast the server to avoid TypeScript checking issues
  const app = (server as any).app;
  return supertest(app);
}

// Function to create a mock MCP server for testing
export function createMockServer(): McpServer {
  const app = express();
  app.use(express.json());
  
  // Create routes for API testing
  app.get('/api/projects', async (req, res) => {
    try {
      const result = await MockProjectController.listProjects();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.get('/api/issues/search', async (req, res) => {
    try {
      const options = {
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        sortBy: req.query.sortBy as string
      };
      const result = await MockIssueController.searchIssues(req.query.query as string, options);
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        content: [{ type: 'text', text: 'Error searching issues' }],
        isError: true 
      });
    }
  });
  
  app.get('/api/issues/:issueId', async (req, res) => {
    try {
      const result = await MockIssueController.getIssue(req.params.issueId);
      if (result.isError) {
        return res.status(404).json(result);
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        content: [{ type: 'text', text: 'Error fetching issue details' }],
        isError: true 
      });
    }
  });
  
  app.get('/api/issues', async (req, res) => {
    try {
      const result = await MockIssueController.findIssuesByCriteria(req.query);
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        content: [{ type: 'text', text: 'Error finding issues' }],
        isError: true 
      });
    }
  });
  
  app.patch('/api/issues/:issueId', async (req, res) => {
    try {
      // Transform status: 'Resolved' to resolved: true for backward compatibility
      const updateData = { ...req.body };
      if (updateData.status === 'Resolved') {
        updateData.resolved = true;
        delete updateData.status;
      }
      
      const result = await MockIssueController.updateIssue(req.params.issueId, updateData);
      if (result.isError) {
        return res.status(500).json(result);
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        content: [{ type: 'text', text: 'Error updating issue' }],
        isError: true 
      });
    }
  });
  
  app.get('/api/boards/:boardId/sprints/:sprintId', async (req, res) => {
    try {
      const result = await MockSprintController.getSprint(req.params.boardId, req.params.sprintId);
      if (!result.success) {
        return res.status(404).json({ error: 'Sprint not found' });
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.get('/api/sprints', async (req, res) => {
    try {
      const result = await MockSprintController.findSprints(req.query);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Mock the server object with tool method
  const server = {
    app,
    router: app,
    tool: (name: string, description: string, schema: any, handler: Function) => {
      return server;
    },
    resource: (name: string, template: any, handler: Function) => {
      return server;
    }
  };
  
  return server as unknown as McpServer;
}

// Mock controllers for testing
const MockProjectController = {
  listProjects: async () => {
    return { success: true, data: await mockProjectGetAll() };
  }
};

const MockIssueController = {
  getIssue: async (issueId: string) => {
    const issue = await mockIssueGetById(issueId);
    if (!issue) return { 
      content: [{ type: 'text', text: `No issue found with ID: ${issueId}` }],
      isError: true 
    };
    return { 
      content: [{ 
        type: 'text', 
        text: `Issue details for ${issue.id}: ${issue.summary}` 
      }]
    };
  },
  searchIssues: async (query: string, options = {}) => {
    const issues = await mockSearchIssues(query, options);
    return { 
      content: [{ 
        type: 'text', 
        text: `Found ${issues.length} issues matching query: "${query}"` 
      }]
    };
  },
  findIssuesByCriteria: async (criteria: any) => {
    const issues = await mockFindByCriteria(criteria);
    return { 
      content: [{ 
        type: 'text', 
        text: `Found ${issues.length} issues matching criteria.` 
      }]
    };
  },
  updateIssue: async (issueId: string, updateData: any) => {
    try {
      const issue = await mockUpdateIssue(issueId, updateData);
      return { 
        content: [{ 
          type: 'text', 
          text: `Issue ${issueId} successfully updated` 
        }]
      };
    } catch (error) {
      return { 
        content: [{ 
          type: 'text', 
          text: `Error updating issue: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }],
        isError: true 
      };
    }
  }
};

const MockSprintController = {
  getSprint: async (boardId: string, sprintId: string) => {
    const sprint = await mockGetById(boardId, sprintId);
    if (!sprint) return { success: false, error: 'Sprint not found' };
    return { success: true, data: sprint };
  },
  findSprints: async (options: any) => {
    const sprints = await mockFindSprints(options);
    return { success: true, data: sprints };
  }
};

// Function to create typed mocks for use in tests
export function createMockFn(): jest.Mock {
  return jest.fn();
}

export const server = {
  tool: jest.fn()
};

/**
 * Create a valid project list controller result
 */
export function createProjectListResult(projects: YouTrackTypes.Project[]): ControllerResult<ProjectListResult> {
  return {
    success: true,
    data: {
      projects,
      total: projects.length
    }
  };
}

/**
 * Create a valid project detail controller result
 */
export function createProjectDetailResult(project: YouTrackTypes.Project): ControllerResult<ProjectDetailResult> {
  return {
    success: true,
    data: {
      project
    }
  };
}

/**
 * Create a valid issue list controller result
 */
export function createIssueListResult(
  issues: YouTrackTypes.Issue[], 
  title?: string
): ControllerResult<IssueListResult> {
  return {
    success: true,
    data: {
      issues,
      total: issues.length,
      title
    }
  };
}

/**
 * Create a valid issue detail controller result
 */
export function createIssueDetailResult(
  issue: YouTrackTypes.IssueWithActivities, 
  activities?: YouTrackTypes.Activity[]
): ControllerResult<IssueDetailResult> {
  return {
    success: true,
    data: {
      issue,
      activities
    }
  };
}

/**
 * Create a valid issue update controller result
 */
export function createIssueUpdateResult(issueId: string): ControllerResult<IssueUpdateResult> {
  return {
    success: true,
    data: {
      issueId,
      updated: true
    }
  };
}

/**
 * Create a valid board list controller result
 */
export function createBoardListResult(boards: YouTrackTypes.Board[]): ControllerResult<BoardListResult> {
  return {
    success: true,
    data: {
      boards,
      total: boards.length
    }
  };
}

/**
 * Create a valid board detail controller result
 */
export function createBoardDetailResult(
  board: YouTrackTypes.Board,
  columns?: YouTrackTypes.AgileColumn[],
  issues?: YouTrackTypes.Issue[]
): ControllerResult<BoardDetailResult> {
  return {
    success: true,
    data: {
      board,
      columns,
      issues
    }
  };
}

/**
 * Create a valid sprint list controller result
 */
export function createSprintListResult(sprints: YouTrackTypes.Sprint[]): ControllerResult<SprintListResult> {
  return {
    success: true,
    data: {
      sprints,
      total: sprints.length
    }
  };
}

/**
 * Create a valid sprint detail controller result
 */
export function createSprintDetailResult(
  sprint: YouTrackTypes.Sprint,
  boardId: string
): ControllerResult<SprintDetailResult> {
  return {
    success: true,
    data: {
      sprint,
      boardId
    }
  };
}

/**
 * Create an error controller result
 */
export function createErrorResult<T>(errorMessage: string): ControllerResult<T> {
  return {
    success: false,
    error: errorMessage
  };
}

/**
 * Helper for handling server.tool() calls in tests
 */
export function tool(name: string, description: string, parameters: Record<string, unknown>, handler: Function) {
  return server.tool(name, description, parameters, handler);
} 