import { BoardModel } from '../models/board';
import { BoardView } from '../views/boardView';
import { McpResponse, ResourceResponse } from '../views/common';
import { URL } from 'url';
import { ControllerResult, BoardDetailResult, BoardListResult, Request } from '../types/controllerResults';
import { extractParam, createResourceErrorResponse, withErrorHandling } from '../utils/controller-utils';
import { PAGINATION_LIMITS, DEFAULT_PAGINATION } from '../utils/constants';

export class BoardController {
  static listBoards = withErrorHandling(
    async (options?: { limit?: number; skip?: number }): Promise<ControllerResult<BoardListResult>> => {
      const boards = await BoardModel.getAll(options);
      return {
        success: true,
        data: {
          boards,
          total: boards.length,
          pagination: {
            limit: options?.limit,
            skip: options?.skip || 0,
            totalItems: boards.length
          }
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
    const limit = req.query && typeof req.query.limit === 'string' ? 
      Math.min(Number(req.query.limit), PAGINATION_LIMITS.BOARDS) : DEFAULT_PAGINATION.LIMIT;
    const skip = req.query && typeof req.query.skip === 'string' ? 
      Number(req.query.skip) : DEFAULT_PAGINATION.SKIP;
    
    try {
      if (boardId) {
        // Get specific board
        const board = await BoardModel.getById(boardId);
        return BoardView.handleResourceRequest(uri, board || undefined);
      } else {
        // List all boards with pagination
        const boards = await BoardModel.getAll({ limit, skip });
        return BoardView.handleResourceRequest(uri, boards);
      }
    } catch (error) {
      return createResourceErrorResponse(uri, error);
    }
  }

  static getBoards = withErrorHandling(
    async (options?: { limit?: number; skip?: number }): Promise<ControllerResult<BoardListResult>> => {
      const boards = await BoardModel.getAll(options);
      return {
        success: true,
        data: {
          boards,
          total: boards.length,
          pagination: {
            limit: options?.limit,
            skip: options?.skip || 0,
            totalItems: boards.length
          }
        }
      };
    },
    'Error fetching boards'
  );
} 