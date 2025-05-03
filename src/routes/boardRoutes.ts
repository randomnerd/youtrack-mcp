import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { BoardController } from '../controllers/boardController';
import { McpResponse } from '../views/common';
import { BoardView } from '../views/boardView';
import { ControllerResult, BoardListResult, BoardDetailResult } from '../types/controllerResults';
import { PAGINATION_LIMITS, DEFAULT_PAGINATION } from '../utils/constants';

export function registerBoardRoutes(server: McpServer) {
  // List all available agile boards
  server.tool(
    'youtrack_list_boards',
    'List all available agile boards',
    {
      limit: z.number().optional().transform(val => 
        Math.min(Math.max(val || DEFAULT_PAGINATION.LIMIT, 1), PAGINATION_LIMITS.BOARDS)
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
} 