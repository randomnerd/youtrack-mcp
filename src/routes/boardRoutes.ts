import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { BoardController } from '../controllers/boardController';
import { McpResponse } from '../views/common';
import { BoardView } from '../views/boardView';
import { PAGINATION_LIMITS, DEFAULT_PAGINATION } from '../utils/constants';
import { Request } from '../types/controllerResults';

export function registerBoardRoutes(server: McpServer) {
  // List all available agile boards
  server.tool(
    'youtrack_list_boards',
    'List all available agile boards',
    {
      limit: z.number().optional().transform(val => 
        val === undefined || val <= 0 ? DEFAULT_PAGINATION.LIMIT : Math.min(Math.max(val, 1), PAGINATION_LIMITS.BOARDS)
      ).describe(`Maximum number of boards to return (1-${PAGINATION_LIMITS.BOARDS})`),
      skip: z.number().optional().transform(val => 
        Math.max(val || DEFAULT_PAGINATION.SKIP, 0)
      ).describe('Number of boards to skip (for pagination)')
    },
    async ({ limit, skip }): Promise<McpResponse> => {
      // Call controller to get data
      const result = await BoardController.listBoards({ limit, skip });
      
      // Pass result to view for rendering
      return BoardView.renderList(result);
    }
  );

  // Get details of a specific agile board
  server.tool(
    'youtrack_get_board',
    'Get details of a specific agile board',
    {
      boardId: z.string().describe('ID of the agile board')
    },
    async ({ boardId }): Promise<McpResponse> => {
      // Call controller to get data
      const result = await BoardController.getBoard(boardId);
      
      return BoardView.renderDetail(result);
    }
  );

  server.resource(
    "boards",
    new ResourceTemplate("youtrack://boards/{boardId?}/sprints/{sprintId?}/issues/{issueId?}", { list: undefined }),
    async (uri, req) => BoardController.handleResourceRequest(uri, {
      ...req,
      params: req.variables || {},
    } as Request)
  );  
} 