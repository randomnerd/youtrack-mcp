import { BoardModel } from '../models/board';
import { BoardView } from '../views/boardView';
import { McpResponse, ResourceResponse } from '../views/common';
import { extractParam, createResourceErrorResponse, withErrorHandling } from '../utils/controller-utils';

export class BoardController {
  static listBoards = withErrorHandling(
    async (): Promise<McpResponse> => {
      const boards = await BoardModel.getAll();
      if (!boards || boards.length === 0) {
        return BoardView.renderEmpty("No agile boards found.");
      }
      return BoardView.renderList(boards);
    },
    'Error fetching agile boards'
  );

  static getBoard = withErrorHandling(
    async (boardId: string): Promise<McpResponse> => {
      const board = await BoardModel.getById(boardId);
      if (!board) {
        return BoardView.renderError(`No board found with ID: ${boardId}`);
      }
      return BoardView.renderDetail(board);
    },
    'Error fetching board details'
  );
  
  static async handleResourceRequest(uri: URL, req: any): Promise<ResourceResponse> {
    // Extract boardId parameter
    const boardId = extractParam(req.params, 'boardId');
    
    try {
      if (boardId) {
        // Get specific board
        const board = await BoardModel.getById(boardId);
        return BoardView.handleResourceRequest(uri, board || undefined);
      } else {
        // List all boards
        const boards = await BoardModel.getAll();
        return BoardView.handleResourceRequest(uri, boards);
      }
    } catch (error) {
      return createResourceErrorResponse(uri, error);
    }
  }
} 