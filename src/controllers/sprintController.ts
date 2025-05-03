import { SprintModel } from '../models/sprint';
import { BoardModel } from '../models/board';
import { SprintView } from '../views/sprintView';
import { McpResponse, ResourceResponse } from '../views/common';
import { extractParam, createResourceErrorResponse, withErrorHandling } from '../utils/controller-utils';

export class SprintController {
  static getSprint = withErrorHandling(
    async (boardId: string, sprintId: string): Promise<McpResponse> => {
      const sprint = await SprintModel.getById(boardId, sprintId);

      if (!sprint) {
        return SprintView.renderError(`No sprint found with ID: ${sprintId} on board: ${boardId}`);
      }

      // Get sprint issues if the sprint doesn't already have them
      let issues = sprint.issues || [];
      if (!issues.length) {
        try {
          // Get issues associated with this sprint
          const sprintIssues = await SprintModel.getSprintIssues(sprint.name);
          issues = sprintIssues;
        } catch (err) {
          console.error("Error fetching sprint issues:", err);
        }
      }

      return SprintView.renderDetail(sprint, boardId, issues);
    },
    'Error fetching sprint details'
  );

  static findSprints = withErrorHandling(
    async (options: {
      boardId?: string;
      sprintName?: string;
      status?: 'active' | 'archived' | 'all';
      limit?: number;
    }): Promise<McpResponse> => {
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
      
      return SprintView.renderList(sprints, boardName);
    },
    'Error finding sprints'
  );
  
  static async handleResourceRequest(uri: URL, req: any): Promise<ResourceResponse> {
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