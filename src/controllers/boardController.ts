import { BoardModel } from '../models/board';
import { BoardView } from '../views/boardView';
import { McpResponse, ResourceResponse } from '../views/common';
import { URL } from 'url';
import { ControllerResult, BoardDetailResult, BoardListResult, Request } from '../types/controllerResults';
import { extractParam, createResourceErrorResponse, withErrorHandling } from '../utils/controller-utils';

export class BoardController {
  static getBoards = withErrorHandling(
    async (): Promise<ControllerResult<BoardListResult>> => {
      const boards = await BoardModel.getAll();
      return {
        success: true,
        data: {
          boards,
          total: boards.length
        }
      };
    },
    'Error fetching boards'
  );
  
  static getBoard = withErrorHandling(
    async (boardId: string): Promise<ControllerResult<BoardDetailResult>> => {
      const board = await BoardModel.getById(boardId);
      if (!board) {
        return {
          success: false,
          error: `No board found with ID: ${boardId}`
        };
      }
      
      return {
        success: true,
        data: {
          board
        }
      };
    },
    'Error fetching board'
  );
    
  static async handleResourceRequest(uri: URL, req: Request): Promise<ResourceResponse> {
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