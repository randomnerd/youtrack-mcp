import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { BoardController } from '../controllers/boardController';

export function registerBoardRoutes(server: McpServer) {
  // Get all agile boards
  server.tool(
    'youtrack_list_boards',
    'List all available agile boards',
    {},
    async () => {
      return await BoardController.listBoards();
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
      return await BoardController.getBoard(boardId);
    }
  );
} 