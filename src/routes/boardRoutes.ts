import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { BoardController } from '../controllers/boardController';
import { McpResponse } from '../views/common';
import { BoardView } from '../views/boardView';
import { ControllerResult, BoardListResult, BoardDetailResult } from '../types/controllerResults';

export function registerBoardRoutes(server: McpServer) {
  // Get all agile boards
  server.tool(
    'youtrack_list_boards',
    'List all available agile boards',
    {},
    async () => {
      const result = await BoardController.getBoards();
      if (result.success && result.data) {
        return BoardView.renderList((result.data as BoardListResult).boards);
      } else {
        return BoardView.renderError(String(result.error || 'Failed to fetch boards'));
      }
    }
  );

  // Get board details
  server.tool(
    'youtrack_get_board',
    'Get details of a specific agile board',
    {
      boardId: z.string().describe('ID of the agile board'),
    },
    async ({ boardId }) => {
      const result = await BoardController.getBoard(boardId);
      if (result.success && result.data) {
        return BoardView.renderDetail((result.data as BoardDetailResult).board);
      } else {
        return BoardView.renderError(String(result.error || 'Failed to fetch board'));
      }
    }
  );
} 