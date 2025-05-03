import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SprintController } from '../controllers/sprintController';
import { McpResponse } from '../views/common';
import { SprintView } from '../views/sprintView';
import { ControllerResult } from '../types/controllerResults';

export function registerSprintRoutes(server: McpServer) {
  // Get sprint details
  server.tool(
    'youtrack_get_sprint',
    'Get details of a specific sprint',
    {
      boardId: z.string().describe('ID of the agile board'),
      sprintId: z.string().describe('ID of the sprint'),
    },
    async ({ boardId, sprintId }): Promise<McpResponse> => {
      const result = await SprintController.getSprint(boardId, sprintId);

      return SprintView.renderDetail(result);
    }
  );

  // Find sprints
  server.tool(
    'youtrack_find_sprints',
    'Find sprints by board, name, status, or time period',
    {
      boardId: z.string().optional().describe('ID of the agile board'),
      sprintName: z.string().optional().describe('Partial or full name of sprint to search for'),
      status: z.enum(['active', 'archived', 'all']).optional().default('all').describe('Status of sprints to find'),
      limit: z.number().optional().transform(val => Math.min(Math.max(val || 10, 1), 50)).describe('Maximum number of sprints to return (1-50)')
    },
    async (options): Promise<McpResponse> => {
      const result = await SprintController.findSprints(options);

      return SprintView.renderList(result, options.boardId);
    }
  );
} 