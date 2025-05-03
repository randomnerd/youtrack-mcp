import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import youtrackClient from './youtrack-client';
import { mapIssueToAIReadableText } from './utils/issue-mapper.js';
import * as YouTrackTypes from './types/youtrack';

// Create an MCP server for YouTrack
const server = new McpServer({
  name: 'YouTrack Manager',
  version: '1.0.0',
  description: 'MCP server for managing YouTrack agile boards and tasks',
});

// Type definitions for search and sprint operations
interface SearchOptions {
  $top?: number;
  $skip?: number;
  fields?: string;
  query?: string;
  sort?: string;
  customFields?: string;
  [key: string]: unknown;
}

interface SprintWithBoard {
  id: string;
  name: string;
  start?: string | Date;
  finish?: string | Date;
  goal?: string;
  boardId?: string;
  boardName?: string;
  // Other possible sprint properties
  archived?: boolean;
  unresolvedIssuesCount?: number;
  [key: string]: unknown;
}

// Get all agile boards
server.tool(
  'youtrack_list_boards',
  'List all available agile boards',
  {},
  async () => {
    try {
      const boards = await youtrackClient.listBoards();

      if (!boards || boards.length === 0) {
        return {
          content: [{ type: 'text', text: 'No agile boards found.' }],
        };
      }

      const boardsText = boards
        .map(
          (board) =>
            `ID: ${board.id}\nName: ${board.name}\nProjects: ${
              board.projects ? board.projects.map((p) => p.name).join(', ') : 'None'
            }`
        )
        .join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `Summary: Found ${boards.length} agile boards`,
          },
          {
            type: 'text',
            text: `Boards Overview:\n\n${boardsText}`,
          }
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching agile boards: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
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
    try {
      const board = await youtrackClient.getBoard(boardId);

      if (!board) {
        return {
          content: [
            { type: 'text', text: `No board found with ID: ${boardId}` },
          ],
          isError: true,
        };
      }

      const sprintsText =
        board.sprints && board.sprints.length > 0
          ? board.sprints
              .map(
                (sprint) =>
                  `  - ${sprint.name} (ID: ${sprint.id})\n    Period: ${
                    sprint.start
                      ? new Date(sprint.start).toLocaleDateString()
                      : 'N/A'
                  } - ${
                    sprint.finish
                      ? new Date(sprint.finish).toLocaleDateString()
                      : 'N/A'
                  }`
              )
              .join('\n')
          : '  No sprints found';

      const projectsText = board.projects
        ? board.projects.map((p) => p.name).join(', ')
        : 'None';

      return {
        content: [
          {
            type: 'text',
            text: `Summary: Board "${board.name}" (ID: ${board.id})`,
          },
          {
            type: 'text',
            text: `Board Details:\nName: ${board.name} (ID: ${board.id})\nProjects: ${projectsText}\n\nSprints:\n${sprintsText}`,
          }
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching board details: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Get sprint details
server.tool(
  'youtrack_get_sprint',
  'Get details of a specific sprint',
  {
    boardId: z.string().describe('ID of the agile board'),
    sprintId: z.string().describe('ID of the sprint'),
  },
  async ({ boardId, sprintId }) => {
    try {
      const sprint = await youtrackClient.getSprint(boardId, sprintId);

      if (!sprint) {
        return {
          content: [
            {
              type: 'text',
              text: `No sprint found with ID: ${sprintId} on board: ${boardId}`,
            },
          ],
          isError: true,
        };
      }

      // Get sprint issues if the sprint doesn't already have them
      let issues = sprint.issues || [];
      if (!issues.length) {
        try {
          // The library doesn't have a direct method to get sprint issues,
          // so we need to search for them with a query
          const sprintIssues = await youtrackClient.searchIssues(`sprint: {${sprint.name}}`);
          issues = sprintIssues;
        } catch (err) {
          console.error("Error fetching sprint issues:", err);
        }
      }

      // Sprint summary for the overview
      const sprintSummary = {
        type: 'text' as const,
        text: `Summary: Sprint "${sprint.name}" (ID: ${sprint.id})`
      };

      // Sprint details
      const sprintDetails = {
        type: 'text' as const,
        text: `Sprint Details:
Name: ${sprint.name} (ID: ${sprint.id})
Board ID: ${boardId}
Period: ${sprint.start ? new Date(sprint.start).toLocaleDateString() : 'N/A'} - ${sprint.finish ? new Date(sprint.finish).toLocaleDateString() : 'N/A'}
Issue Count: ${issues.length || 0}
`
      };

      // If no issues found, return only sprint details
      if (!issues || issues.length === 0) {
        return {
          content: [
            sprintSummary,
            sprintDetails,
            {
              type: 'text' as const,
              text: 'No issues found in this sprint.'
            }
          ],
        };
      }

      // Process each issue and format with the mapIssueToAIReadableText function
      const issueContents = issues.map((issue, index) => {
        try {
          return {
            type: 'text' as const,
            text: `--- Issue ${index + 1} of ${issues.length} ---\n${mapIssueToAIReadableText(issue)}\n${'-'.repeat(50)}`
          };
        } catch (error) {
          return {
            type: 'text' as const,
            text: `--- Issue ${index + 1} of ${issues.length} ---\nError processing issue ${issue.id}: ${issue.summary || 'No summary'}\n${'-'.repeat(50)}`
          };
        }
      });

      // Return complete response with sprint summary, details and all formatted issues
      return {
        content: [
          sprintSummary,
          sprintDetails,
          ...issueContents
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching sprint details: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_issue",
  "Get details of a specific issue",
  {
    issueId: z.string().describe("ID of the issue")
  },
  async ({ issueId }) => {
    try {
      const issue: YouTrackTypes.Issue = await youtrackClient.getIssue(issueId);
      
      if (!issue) {
        return {
          content: [{ type: "text", text: `No issue found with ID: ${issueId}` }],
          isError: true
        };
      }
      
      return {
        content: [{ 
          type: "text", 
          text: mapIssueToAIReadableText(issue), 
        }]
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error fetching issue details: ${error.message}` }],
        isError: true
      };
    }
  });

server.tool(
  "update_issue",
  "Update an existing issue",
  {
    issueId: z.string().describe("ID of the issue to update"),
    summary: z.string().optional().describe("New issue summary/title"),
    description: z.string().optional().describe("New issue description"),
    resolved: z.boolean().optional().describe("Set issue as resolved")
  },
  async ({ issueId, summary, description, resolved }) => {
    try {
      await youtrackClient.updateIssue(issueId, {
        summary,
        description,
        resolved
      });
      
      return {
        content: [{ 
          type: "text", 
          text: `Issue ${issueId} updated successfully!` 
        }]
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{ type: "text", text: `Error updating issue: ${errorMessage}` }],
        isError: true
      };
    }
  }
);

// List projects
server.tool(
  "list_projects",
  "List all available projects",
  {},
  async () => {
    try {
      const projects = await youtrackClient.listProjects();
      
      if (!projects || projects.length === 0) {
        return {
          content: [{ type: "text", text: "No projects found." }]
        };
      }
      
      const projectsText = projects.map(project => 
        `ID: ${project.id}\nName: ${project.name}\nShort Name: ${project.shortName}`
      ).join('\n\n');
      
      return {
        content: [{ 
          type: "text", 
          text: `Found ${projects.length} projects:\n\n${projectsText}` 
        }]
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{ type: "text", text: `Error fetching projects: ${errorMessage}` }],
        isError: true
      };
    }
  }
);

// Search issues with advanced query
server.tool(
  "search_issues",
  "Search for issues using YouTrack query syntax",
  {
    query: z.string().describe("YouTrack search query string (e.g., 'assignee: me #Unresolved')"),
    limit: z.number().optional().transform(val => Math.min(Math.max(val || 10, 1), 50)).describe("Maximum number of issues to return (1-50)"),
    sortBy: z.string().optional().describe("Field to sort results by (e.g., 'created', 'updated', 'priority')")
  },
  async ({ query, limit, sortBy }) => {
    try {
      // Search for issues with the provided query and options
      const issues = await youtrackClient.searchIssues(query || '', { limit, sortBy });
      
      // Check if issues array is valid
      if (!Array.isArray(issues)) {
        return {
          content: [{ 
            type: "text" as const, 
            text: `Error: Invalid response from YouTrack API.` 
          }],
          isError: true
        };
      }
      
      // Ensure limit is a valid number
      const safeLimit = typeof limit === 'number' && limit > 0 ? limit : 10;
      
      // Limit the number of results
      const limitedIssues = issues.slice(0, safeLimit);
      
      if (limitedIssues.length === 0) {
        return {
          content: [{ 
            type: "text" as const, 
            text: `No issues found matching query: ${query}` 
          }]
        };
      }
      
      // Provide a summary and detailed results
      const summaryContent = {
        type: "text" as const,
        text: `Found ${issues.length} issues matching query: "${query}"\nShowing ${limitedIssues.length} results.`
      };
      
      // Create content entries for each issue
      const issueContents = limitedIssues.map((issue, index) => {
        try {
          return {
            type: "text" as const,
            text: `--- Issue ${index + 1} of ${limitedIssues.length} ---\n${mapIssueToAIReadableText(issue)}\n${'-'.repeat(50)}`
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Error processing issue ${issue.id}:`, errorMessage);
          return {
            type: "text" as const,
            text: `--- Issue ${index + 1} of ${limitedIssues.length} ---\nError processing issue ${issue.id || 'unknown'}: ${issue.summary || 'No summary'}\nError: ${errorMessage}\n${'-'.repeat(50)}`
          };
        }
      });
      
      return {
        content: [summaryContent, ...issueContents]
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error searching issues:', errorMessage);
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error searching issues: ${errorMessage}` 
        }],
        isError: true
      };
    }
  }
);

// Search for issues by specific criteria
server.tool(
  "find_issues_by_criteria",
  "Find issues by specific criteria like assignee, sprint, type, or status",
  {
    project: z.string().optional().describe("Project ID or name"),
    assignee: z.string().optional().describe("Username of assignee (or 'me' for current user)"),
    sprint: z.string().optional().describe("Sprint name"),
    type: z.string().optional().describe("Issue type (e.g., Bug, Task, Feature)"), 
    status: z.string().optional().describe("Issue status (e.g., Open, In Progress, Resolved)"),
    limit: z.number().optional().transform(val => Math.min(Math.max(val || 10, 1), 50)).describe("Maximum number of issues to return (1-50)")
  },
  async ({ project, assignee, sprint, type, status, limit }) => {
    try {
      // Call the dedicated method for finding issues by criteria
      const issues = await youtrackClient.findIssuesByCriteria({
        project,
        assignee,
        sprint,
        type,
        status,
        limit
      });
      
      // Check if issues array is valid
      if (!Array.isArray(issues)) {
        return {
          content: [{ 
            type: "text" as const, 
            text: `Error: Invalid response from YouTrack API.` 
          }],
          isError: true
        };
      }
      
      // Ensure limit is a valid number
      const safeLimit = typeof limit === 'number' && limit > 0 ? limit : 10;
      
      // Limit the number of results
      const limitedIssues = issues.slice(0, safeLimit);
      
      if (limitedIssues.length === 0) {
        return {
          content: [{ 
            type: "text" as const, 
            text: `No issues found matching criteria.` 
          }]
        };
      }
      
      // Build query string for display purposes
      const queryParts: string[] = [];
      
      if (project) queryParts.push(`project: {${project}}`);
      if (assignee) queryParts.push(`assignee: ${assignee}`);
      if (sprint) queryParts.push(`sprint: {${sprint}}`);
      if (type) queryParts.push(`Type: {${type}}`);
      if (status) {
        if (status.toLowerCase() === 'resolved') {
          queryParts.push('#Resolved');
        } else if (status.toLowerCase() === 'unresolved') {
          queryParts.push('#Unresolved');
        } else {
          queryParts.push(`State: {${status}}`);
        }
      }
      
      const queryDisplay = queryParts.length > 0 ? queryParts.join(' ') : 'All issues';
      
      // Provide a summary
      const summaryContent = {
        type: "text" as const,
        text: `Found ${issues.length} issues matching criteria.\nUsed query: "${queryDisplay}"\nShowing ${limitedIssues.length} results.`
      };
      
      // Create content entries for each issue
      const issueContents = limitedIssues.map((issue, index) => {
        try {
          return {
            type: "text" as const,
            text: `--- Issue ${index + 1} of ${limitedIssues.length} ---\n${mapIssueToAIReadableText(issue)}\n${'-'.repeat(50)}`
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Error processing issue ${issue.id}:`, errorMessage);
          return {
            type: "text" as const,
            text: `--- Issue ${index + 1} of ${limitedIssues.length} ---\nError processing issue ${issue.id || 'unknown'}: ${issue.summary || 'No summary'}\nError: ${errorMessage}\n${'-'.repeat(50)}`
          };
        }
      });
      
      return {
        content: [summaryContent, ...issueContents]
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error searching issues by criteria:', errorMessage);
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error searching issues: ${errorMessage}` 
        }],
        isError: true
      };
    }
  }
);

// Find sprints by criteria
server.tool(
  "find_sprints",
  "Find sprints by board, name, status, or time period",
  {
    boardId: z.string().optional().describe("ID of the agile board"),
    sprintName: z.string().optional().describe("Partial or full name of sprint to search for"),
    status: z.enum(["active", "archived", "all"]).optional().default("all").describe("Status of sprints to find"),
    limit: z.number().optional().transform(val => Math.min(Math.max(val || 10, 1), 50)).describe("Maximum number of sprints to return (1-50)")
  },
  async ({ boardId, sprintName, status, limit }) => {
    try {
      // Use the dedicated method for finding sprints
      const sprints = await youtrackClient.findSprints({
        boardId,
        sprintName,
        status,
        limit
      });
      
      // Ensure limit is a valid number
      const safeLimit = typeof limit === 'number' && limit > 0 ? limit : 10;
      
      // Limit results
      const limitedSprints = sprints.slice(0, safeLimit);
      
      if (limitedSprints.length === 0) {
        return {
          content: [{ 
            type: "text" as const, 
            text: `No sprints found matching the provided criteria.` 
          }]
        };
      }
      
      // Format sprint information
      const sprintsText = limitedSprints.map(sprint => {
        // For displaying board info, we might need to fetch extra board data
        const boardInfo = boardId ? 
          `Board ID: ${boardId}` : 
          `Board ID: Unknown`;
        
        const startDate = sprint.start ? new Date(sprint.start).toLocaleDateString() : 'N/A';
        const finishDate = sprint.finish ? new Date(sprint.finish).toLocaleDateString() : 'N/A';
        
        return `Sprint: ${sprint.name} (ID: ${sprint.id})
${boardInfo}
Period: ${startDate} - ${finishDate}`;
      }).join('\n\n' + '-'.repeat(50) + '\n\n');
      
      return {
        content: [{ 
          type: "text" as const, 
          text: `Found ${sprints.length} sprints${boardId ? ` for board ${boardId}` : ''}.${sprintName ? ` Filtered by name: "${sprintName}"` : ''}${status !== 'all' ? ` Status: ${status}` : ''}\nShowing ${limitedSprints.length} results.\n\n${sprintsText}` 
        }]
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error finding sprints:', errorMessage);
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error finding sprints: ${errorMessage}` 
        }],
        isError: true
      };
    }
  }
);

// Resource for boards
server.resource(
  "boards",
  new ResourceTemplate("youtrack://boards/{boardId?}", { list: undefined }),
  async (uri, req) => {
    // Safely handle params by casting to any first
    const params = req.params as any;
    const boardId = typeof params?.boardId === 'string' ? params.boardId : 
                   Array.isArray(params?.boardId) ? params.boardId[0] : undefined;
    
    try {
      if (boardId) {
        // Get specific board
        const board = await youtrackClient.getBoard(boardId);
        
        if (!board) {
          return {
            contents: [{
              uri: uri.href,
              text: `No board found with ID: ${boardId}`
            }]
          };
        }
        
        const sprintsText = board.sprints && board.sprints.length > 0
          ? board.sprints.map(sprint => 
              `  - ${sprint.name} (ID: ${sprint.id})\n    Period: ${sprint.start ? new Date(sprint.start).toLocaleDateString() : 'N/A'} - ${sprint.finish ? new Date(sprint.finish).toLocaleDateString() : 'N/A'}`
            ).join('\n')
          : '  No sprints found';
        
        return {
          contents: [{
            uri: uri.href,
            text: `Board: ${board.name} (ID: ${board.id})\n\nProjects: ${board.projects?.map(p => p.name).join(', ') || 'None'}\n\nSprints:\n${sprintsText}`
          }]
        };
      } else {
        // List all boards
        const boards = await youtrackClient.listBoards();
        
        if (!boards || boards.length === 0) {
          return {
            contents: [{
              uri: uri.href,
              text: "No agile boards found."
            }]
          };
        }
        
        const boardsText = boards.map(board => 
          `ID: ${board.id}\nName: ${board.name}\nProjects: ${board.projects?.map(p => p.name).join(', ') || 'None'}`
        ).join('\n\n');
        
        return {
          contents: [{
            uri: uri.href,
            text: `Found ${boards.length} agile boards:\n\n${boardsText}`
          }]
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        contents: [{
          uri: uri.href,
          text: `Error: ${errorMessage}`
        }]
      };
    }
  }
);

// Resource for sprints
server.resource(
  "sprints",
  new ResourceTemplate("youtrack://boards/{boardId}/sprints/{sprintId?}", { list: undefined }),
  async (uri, req) => {
    // Safely handle params by casting to any first
    const params = req.params as any;
    const boardId = typeof params?.boardId === 'string' ? params.boardId : 
                   Array.isArray(params?.boardId) ? params.boardId[0] : undefined;
    const sprintId = typeof params?.sprintId === 'string' ? params.sprintId : 
                    Array.isArray(params?.sprintId) ? params.sprintId[0] : undefined;
    
    try {
      if (!boardId) {
        return {
          contents: [{
            uri: uri.href,
            text: "Board ID is required."
          }]
        };
      }
      
      if (sprintId) {
        // Get specific sprint
        const sprint = await youtrackClient.getSprint(boardId, sprintId);
        
        if (!sprint) {
          return {
            contents: [{
              uri: uri.href,
              text: `No sprint found with ID: ${sprintId} on board: ${boardId}`
            }]
          };
        }
        
        // Get issues if they're not already on the sprint
        let issues = sprint.issues || [];
        if (!issues.length) {
          try {
            const sprintIssues = await youtrackClient.searchIssues(`sprint: {${sprint.name}}`);
            issues = sprintIssues;
          } catch (err) {
            console.error("Error fetching sprint issues:", err);
          }
        }
        
        const issuesText = issues && issues.length > 0
          ? issues.map(issue => 
              `  - ${issue.summary} (ID: ${issue.id})\n    Status: ${issue.resolved ? 'Resolved' : 'Open'}`
            ).join('\n')
          : '  No issues found';
        
        return {
          contents: [{
            uri: uri.href,
            text: `Sprint: ${sprint.name} (ID: ${sprint.id})\nBoard: ${boardId}\nPeriod: ${sprint.start ? new Date(sprint.start).toLocaleDateString() : 'N/A'} - ${sprint.finish ? new Date(sprint.finish).toLocaleDateString() : 'N/A'}\n\nIssues:\n${issuesText}`
          }]
        };
      } else {
        // Get board to list its sprints
        const board = await youtrackClient.getBoard(boardId);
        
        if (!board) {
          return {
            contents: [{
              uri: uri.href,
              text: `No board found with ID: ${boardId}`
            }]
          };
        }
        
        const sprintsText = board.sprints && board.sprints.length > 0
          ? board.sprints.map(sprint => 
              `ID: ${sprint.id}\nName: ${sprint.name}\nPeriod: ${sprint.start ? new Date(sprint.start).toLocaleDateString() : 'N/A'} - ${sprint.finish ? new Date(sprint.finish).toLocaleDateString() : 'N/A'}`
            ).join('\n\n')
          : 'No sprints found';
        
        return {
          contents: [{
            uri: uri.href,
            text: `Sprints for board "${board.name}":\n\n${sprintsText}`
          }]
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        contents: [{
          uri: uri.href,
          text: `Error: ${errorMessage}`
        }]
      };
    }
  }
);

// Resource for issues
server.resource(
  "issues",
  new ResourceTemplate("youtrack://issues/{issueId?}", { list: undefined }),
  async (uri, req) => {
    // Safely handle params by casting to any first
    const params = req.params as any;
    const issueId = typeof params?.issueId === 'string' ? params.issueId : 
                   Array.isArray(params?.issueId) ? params.issueId[0] : undefined;
    
    try {
      if (issueId) {
        // Get specific issue
        const issue = await youtrackClient.getIssue(issueId);
        
        if (!issue) {
          return {
            contents: [{
              uri: uri.href,
              text: `No issue found with ID: ${issueId}`
            }]
          };
        }
        
        return {
          contents: [{
            uri: uri.href,
            text: mapIssueToAIReadableText(issue)
          }]
        };
      } else {
        return {
          contents: [{
            uri: uri.href,
            text: "Please specify an issue ID or use a sprint resource to list issues."
          }]
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        contents: [{
          uri: uri.href,
          text: `Error: ${errorMessage}`
        }]
      };
    }
  }
);

// Exporting the server for use in the main application
export { server }; 