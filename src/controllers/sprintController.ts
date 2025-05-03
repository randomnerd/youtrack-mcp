import { URL } from 'url';
import { SprintModel } from '../models/sprint';
import { McpResponse, ResourceResponse } from '../views/common';
import { SprintView } from '../views/sprintView';
import { ControllerResult, SprintDetailResult, SprintListResult, Request } from '../types/controllerResults';
import { extractParam, createResourceErrorResponse, withErrorHandling } from '../utils/controller-utils';
import { BoardModel } from '../models/board';

export class SprintController {
  static getSprint = withErrorHandling(
    async (boardId: string, sprintId: string): Promise<ControllerResult<SprintDetailResult>> => {
      const sprint = await SprintModel.getById(boardId, sprintId);

      if (!sprint) {
        return {
          success: false,
          error: `No sprint found with ID: ${sprintId} on board: ${boardId}`
        };
      }

      return {
        success: true,
        data: {
          sprint,
          boardId,
        }
      };
    },
    'Error fetching sprint details'
  );

  static findSprints = withErrorHandling(
    async (options: {
      boardId?: string;
      sprintName?: string;
      status?: 'active' | 'archived' | 'all';
      limit?: number;
      skip?: number;
    }): Promise<ControllerResult<SprintListResult>> => {
      const sprints = await SprintModel.findSprints(options);
      
      // If a board ID was provided, try to get the board name for context
      let boardName;
      if (options.boardId) {
        try {
          const board = await BoardModel.getById(options.boardId);
          boardName = board?.name;
        } catch (err) {
          console.error("Error fetching board details:", err);
        }
      }
      
      return {
        success: true,
        data: {
          sprints,
          total: sprints.length,
          pagination: {
            limit: options.limit,
            skip: options.skip || 0,
            totalItems: sprints.length
          }
        }
      };
    },
    'Error finding sprints'
  );
  
  static async handleResourceRequest(uri: URL, req: Request): Promise<ResourceResponse> {
    // Extract parameters
    const boardId = extractParam(req.params, 'boardId');
    const sprintId = extractParam(req.params, 'sprintId');
    
    try {
      if (!boardId) {
        return {
          contents: [{
            uri: uri.href,
            text: "Board ID is required."
          }]
        };
      }
      
      let board;
      try {
        board = await BoardModel.getById(boardId);
      } catch (err) {
        console.error("Error fetching board details:", err);
      }
      
      if (sprintId) {
        // Get specific sprint
        const sprint = await SprintModel.getById(boardId, sprintId);
        
        if (!sprint) {
          return {
            contents: [{
              uri: uri.href,
              text: "Sprint not found."
            }]
          };
        }
        
        return SprintView.handleResourceRequest(uri, req.params, sprint || undefined, board || undefined);
      } else {
        // Get board to list its sprints
        if (!board) {
          return {
            contents: [{
              uri: uri.href,
              text: "Board not found."
            }]
          };
        }
        
        // Use the sprints from the board directly
        return SprintView.handleResourceRequest(uri, req.params, board.sprints, board);
      }
    } catch (error) {
      return createResourceErrorResponse(uri, error);
    }
  }
} 