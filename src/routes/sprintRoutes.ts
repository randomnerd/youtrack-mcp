import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SprintController } from '../controllers/sprintController';
import { McpResponse } from '../views/common';
import { SprintView } from '../views/sprintView';
import { PAGINATION_LIMITS, DEFAULT_PAGINATION } from '../utils/constants';
import { Request } from '../types/controllerResults';
import { IssueController } from '../controllers/issueController';
import { IssueView } from '../views/issueView';
import { GetPromptRequestSchema, ListPromptsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

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
      boardId: z.string().describe('ID of the agile board'),
      sprintName: z.string().optional().describe('Partial or full name of sprint to search for'),
      status: z.enum(['active', 'archived', 'all']).default('all').describe('Status of sprints to find'),
      limit: z.number().optional().transform(val => 
        val === undefined || val <= 0 ? DEFAULT_PAGINATION.LIMIT : Math.min(Math.max(val, 1), PAGINATION_LIMITS.SPRINTS)
      ).describe(`Maximum number of sprints to return (1-${PAGINATION_LIMITS.SPRINTS})`),
      skip: z.number().optional().transform(val => 
        Math.max(val || DEFAULT_PAGINATION.SKIP, 0)
      ).describe('Number of sprints to skip (for pagination)')
    },
    async ({ boardId, sprintName, status, limit, skip }): Promise<McpResponse> => {
      const result = await SprintController.findSprints({
        boardId,
        sprintName,
        status,
        limit,
        skip
      });

      return SprintView.renderList(result, boardId);
    }
  );

  server.resource(
    "sprints",
    new ResourceTemplate("youtrack://boards/{boardId}/sprints/{sprintId?}", { list: undefined }),
    async (uri, req) => SprintController.handleResourceRequest(uri, {
      ...req,
      params: req.variables || {},
    } as Request)
  );


  const PROMPTS: { 
    [key: string]: { 
      name: string; 
      description: string; 
      arguments: { name: string; description: string; required: boolean; }[] 
    } 
  } = {
    "youtrack_sprint_report": {
      name: "youtrack_sprint_report",
      description: "Generate a report for a specific sprint",
      arguments: [
        {
          name: "sprintName",
          description: "Name of the sprint",
          required: true
        }
      ]
    }
  };

  // Remove or comment out the problematic code
  // server.server.registerCapabilities({
  //   prompts: {},
  // });

  // server.server.setRequestHandler(ListPromptsRequestSchema, async () => {
  //   return {
  //     prompts: Object.values(PROMPTS)
  //   };
  // });
  
  // server.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  //   const prompt = PROMPTS[request.params.name];
  //   if (!prompt) {
  //     throw new Error(`Prompt not found: ${request.params.name}`);
  //   }
  
  //   if (request.params.name === "youtrack_sprint_report") {
  //     const issues = await IssueController.searchIssues(`sprint: {${request.params.arguments?.sprintName}}`);
  //   const formattedIssues = await IssueView.renderList(issues);
  //   const [{ text }] = formattedIssues.content;
  //   return {
  //     messages: [
  //       {
  //         role: 'user',
  //         content: {
  //           type: 'text',
  //           text: `Please generate comprehensive report for the following issues:\n\n${text}`,
  //         },
  //       },
  //       ],
  //     }
  //   }
    
  //   return { prompt };
  // });

  // server.sendPromptListChanged();
} 