import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
    import { z } from 'zod';
    import { youtrackConfig, updateConfig } from './config.js';
    import * as youtrackApi from './youtrack-api.js';

    // Create an MCP server for YouTrack
    const server = new McpServer({
      name: "YouTrack Manager",
      version: "1.0.0",
      description: "MCP server for managing YouTrack agile boards and tasks"
    });

    // Configure YouTrack connection
    server.tool(
      "configure",
      {
        baseUrl: z.string().url().describe("YouTrack base URL (e.g., https://youtrack.example.com)"),
        token: z.string().describe("YouTrack permanent token")
      },
      async ({ baseUrl, token }) => {
        try {
          const config = updateConfig({ baseUrl, token });
          return {
            content: [{ 
              type: "text", 
              text: `YouTrack configuration updated successfully.\nBase URL: ${config.baseUrl}` 
            }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error updating configuration: ${error.message}` }],
            isError: true
          };
        }
      },
      { description: "Configure YouTrack connection settings" }
    );

    // Get all agile boards
    server.tool(
      "list_boards",
      {},
      async () => {
        try {
          const boards = await youtrackApi.getAgileBoards();
          
          if (!boards || boards.length === 0) {
            return {
              content: [{ type: "text", text: "No agile boards found." }]
            };
          }
          
          const boardsText = boards.map(board => 
            `ID: ${board.id}\nName: ${board.name}\nProjects: ${board.projects.map(p => p.name).join(', ')}`
          ).join('\n\n');
          
          return {
            content: [{ 
              type: "text", 
              text: `Found ${boards.length} agile boards:\n\n${boardsText}` 
            }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error fetching agile boards: ${error.message}` }],
            isError: true
          };
        }
      },
      { description: "List all available agile boards" }
    );

    // Get board details
    server.tool(
      "get_board",
      {
        boardId: z.string().describe("ID of the agile board")
      },
      async ({ boardId }) => {
        try {
          const board = await youtrackApi.getAgileBoard(boardId);
          
          if (!board) {
            return {
              content: [{ type: "text", text: `No board found with ID: ${boardId}` }],
              isError: true
            };
          }
          
          const sprintsText = board.sprints && board.sprints.length > 0
            ? board.sprints.map(sprint => 
                `  - ${sprint.name} (ID: ${sprint.id})\n    Status: ${sprint.status || 'N/A'}\n    Period: ${sprint.start ? new Date(sprint.start).toLocaleDateString() : 'N/A'} - ${sprint.finish ? new Date(sprint.finish).toLocaleDateString() : 'N/A'}`
              ).join('\n')
            : '  No sprints found';
          
          return {
            content: [{ 
              type: "text", 
              text: `Board: ${board.name} (ID: ${board.id})\n\nProjects: ${board.projects.map(p => p.name).join(', ')}\n\nSprints:\n${sprintsText}` 
            }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error fetching board details: ${error.message}` }],
            isError: true
          };
        }
      },
      { description: "Get details of a specific agile board" }
    );

    // Get sprint details
    server.tool(
      "get_sprint",
      {
        boardId: z.string().describe("ID of the agile board"),
        sprintId: z.string().describe("ID of the sprint")
      },
      async ({ boardId, sprintId }) => {
        try {
          const sprint = await youtrackApi.getSprint(boardId, sprintId);
          
          if (!sprint) {
            return {
              content: [{ type: "text", text: `No sprint found with ID: ${sprintId} on board: ${boardId}` }],
              isError: true
            };
          }
          
          const issuesText = sprint.issues && sprint.issues.length > 0
            ? sprint.issues.map(issue => 
                `  - ${issue.summary} (ID: ${issue.id})\n    Status: ${issue.resolved ? 'Resolved' : 'Open'}`
              ).join('\n')
            : '  No issues found';
          
          return {
            content: [{ 
              type: "text", 
              text: `Sprint: ${sprint.name} (ID: ${sprint.id})\nBoard: ${sprint.board.name}\nStatus: ${sprint.status || 'N/A'}\nPeriod: ${sprint.start ? new Date(sprint.start).toLocaleDateString() : 'N/A'} - ${sprint.finish ? new Date(sprint.finish).toLocaleDateString() : 'N/A'}\n\nIssues:\n${issuesText}` 
            }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error fetching sprint details: ${error.message}` }],
            isError: true
          };
        }
      },
      { description: "Get details of a specific sprint" }
    );

    // Get issue details
    server.tool(
      "get_issue",
      {
        issueId: z.string().describe("ID of the issue")
      },
      async ({ issueId }) => {
        try {
          const issue = await youtrackApi.getIssue(issueId);
          
          if (!issue) {
            return {
              content: [{ type: "text", text: `No issue found with ID: ${issueId}` }],
              isError: true
            };
          }
          
          const customFieldsText = issue.customFields && issue.customFields.length > 0
            ? issue.customFields.map(field => 
                `  - ${field.name}: ${field.value ? field.value.name : 'Not set'}`
              ).join('\n')
            : '  No custom fields';
          
          const commentsText = issue.comments && issue.comments.length > 0
            ? issue.comments.map(comment => 
                `  - ${comment.author.name}: ${comment.text}`
              ).join('\n')
            : '  No comments';
          
          return {
            content: [{ 
              type: "text", 
              text: `Issue: ${issue.summary} (ID: ${issue.id})\nStatus: ${issue.resolved ? 'Resolved' : 'Open'}\n\nDescription:\n${issue.description || 'No description'}\n\nCustom Fields:\n${customFieldsText}\n\nComments:\n${commentsText}` 
            }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error fetching issue details: ${error.message}` }],
            isError: true
          };
        }
      },
      { description: "Get details of a specific issue" }
    );

    // Create a new issue
    server.tool(
      "create_issue",
      {
        projectId: z.string().describe("ID of the project"),
        summary: z.string().describe("Issue summary/title"),
        description: z.string().optional().describe("Issue description"),
        customFields: z.array(
          z.object({
            name: z.string().describe("Custom field name"),
            value: z.string().describe("Custom field value")
          })
        ).optional().describe("Custom fields to set")
      },
      async ({ projectId, summary, description = '', customFields = [] }) => {
        try {
          // Transform custom fields to the format expected by YouTrack API
          const transformedFields = customFields.map(field => ({
            name: field.name,
            value: field.value
          }));
          
          const issue = await youtrackApi.createIssue(projectId, summary, description, transformedFields);
          
          return {
            content: [{ 
              type: "text", 
              text: `Issue created successfully!\nID: ${issue.id}\nSummary: ${issue.summary}` 
            }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error creating issue: ${error.message}` }],
            isError: true
          };
        }
      },
      { description: "Create a new issue in a project" }
    );

    // Update an issue
    server.tool(
      "update_issue",
      {
        issueId: z.string().describe("ID of the issue to update"),
        summary: z.string().optional().describe("New issue summary/title"),
        description: z.string().optional().describe("New issue description"),
        resolved: z.boolean().optional().describe("Set issue as resolved")
      },
      async ({ issueId, summary, description, resolved }) => {
        try {
          const updates = {};
          
          if (summary !== undefined) updates.summary = summary;
          if (description !== undefined) updates.description = description;
          
          // Handle resolved status if provided
          if (resolved !== undefined) {
            updates.customFields = [{
              name: "State",
              value: resolved ? "Resolved" : "Open"
            }];
          }
          
          await youtrackApi.updateIssue(issueId, updates);
          
          return {
            content: [{ 
              type: "text", 
              text: `Issue ${issueId} updated successfully!` 
            }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error updating issue: ${error.message}` }],
            isError: true
          };
        }
      },
      { description: "Update an existing issue" }
    );

    // Add a comment to an issue
    server.tool(
      "add_comment",
      {
        issueId: z.string().describe("ID of the issue"),
        text: z.string().describe("Comment text")
      },
      async ({ issueId, text }) => {
        try {
          await youtrackApi.addComment(issueId, text);
          
          return {
            content: [{ 
              type: "text", 
              text: `Comment added successfully to issue ${issueId}!` 
            }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error adding comment: ${error.message}` }],
            isError: true
          };
        }
      },
      { description: "Add a comment to an issue" }
    );

    // List projects
    server.tool(
      "list_projects",
      {},
      async () => {
        try {
          const projects = await youtrackApi.getProjects();
          
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
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error fetching projects: ${error.message}` }],
            isError: true
          };
        }
      },
      { description: "List all available projects" }
    );

    // Resource for boards
    server.resource(
      "boards",
      new ResourceTemplate("youtrack://boards/{boardId?}", { list: undefined }),
      async (uri, { boardId }) => {
        try {
          if (boardId) {
            // Get specific board
            const board = await youtrackApi.getAgileBoard(boardId);
            
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
                  `  - ${sprint.name} (ID: ${sprint.id})\n    Status: ${sprint.status || 'N/A'}\n    Period: ${sprint.start ? new Date(sprint.start).toLocaleDateString() : 'N/A'} - ${sprint.finish ? new Date(sprint.finish).toLocaleDateString() : 'N/A'}`
                ).join('\n')
              : '  No sprints found';
            
            return {
              contents: [{
                uri: uri.href,
                text: `Board: ${board.name} (ID: ${board.id})\n\nProjects: ${board.projects.map(p => p.name).join(', ')}\n\nSprints:\n${sprintsText}`
              }]
            };
          } else {
            // List all boards
            const boards = await youtrackApi.getAgileBoards();
            
            if (!boards || boards.length === 0) {
              return {
                contents: [{
                  uri: uri.href,
                  text: "No agile boards found."
                }]
              };
            }
            
            const boardsText = boards.map(board => 
              `ID: ${board.id}\nName: ${board.name}\nProjects: ${board.projects.map(p => p.name).join(', ')}`
            ).join('\n\n');
            
            return {
              contents: [{
                uri: uri.href,
                text: `Found ${boards.length} agile boards:\n\n${boardsText}`
              }]
            };
          }
        } catch (error) {
          return {
            contents: [{
              uri: uri.href,
              text: `Error: ${error.message}`
            }]
          };
        }
      }
    );

    // Resource for sprints
    server.resource(
      "sprints",
      new ResourceTemplate("youtrack://boards/{boardId}/sprints/{sprintId?}", { list: undefined }),
      async (uri, { boardId, sprintId }) => {
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
            const sprint = await youtrackApi.getSprint(boardId, sprintId);
            
            if (!sprint) {
              return {
                contents: [{
                  uri: uri.href,
                  text: `No sprint found with ID: ${sprintId} on board: ${boardId}`
                }]
              };
            }
            
            const issuesText = sprint.issues && sprint.issues.length > 0
              ? sprint.issues.map(issue => 
                  `  - ${issue.summary} (ID: ${issue.id})\n    Status: ${issue.resolved ? 'Resolved' : 'Open'}`
                ).join('\n')
              : '  No issues found';
            
            return {
              contents: [{
                uri: uri.href,
                text: `Sprint: ${sprint.name} (ID: ${sprint.id})\nBoard: ${sprint.board.name}\nStatus: ${sprint.status || 'N/A'}\nPeriod: ${sprint.start ? new Date(sprint.start).toLocaleDateString() : 'N/A'} - ${sprint.finish ? new Date(sprint.finish).toLocaleDateString() : 'N/A'}\n\nIssues:\n${issuesText}`
              }]
            };
          } else {
            // Get board to list its sprints
            const board = await youtrackApi.getAgileBoard(boardId);
            
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
                  `ID: ${sprint.id}\nName: ${sprint.name}\nStatus: ${sprint.status || 'N/A'}\nPeriod: ${sprint.start ? new Date(sprint.start).toLocaleDateString() : 'N/A'} - ${sprint.finish ? new Date(sprint.finish).toLocaleDateString() : 'N/A'}`
                ).join('\n\n')
              : 'No sprints found';
            
            return {
              contents: [{
                uri: uri.href,
                text: `Sprints for board "${board.name}":\n\n${sprintsText}`
              }]
            };
          }
        } catch (error) {
          return {
            contents: [{
              uri: uri.href,
              text: `Error: ${error.message}`
            }]
          };
        }
      }
    );

    // Resource for issues
    server.resource(
      "issues",
      new ResourceTemplate("youtrack://issues/{issueId?}", { list: undefined }),
      async (uri, { issueId }) => {
        try {
          if (issueId) {
            // Get specific issue
            const issue = await youtrackApi.getIssue(issueId);
            
            if (!issue) {
              return {
                contents: [{
                  uri: uri.href,
                  text: `No issue found with ID: ${issueId}`
                }]
              };
            }
            
            const customFieldsText = issue.customFields && issue.customFields.length > 0
              ? issue.customFields.map(field => 
                  `  - ${field.name}: ${field.value ? field.value.name : 'Not set'}`
                ).join('\n')
              : '  No custom fields';
            
            const commentsText = issue.comments && issue.comments.length > 0
              ? issue.comments.map(comment => 
                  `  - ${comment.author.name}: ${comment.text}`
                ).join('\n')
              : '  No comments';
            
            return {
              contents: [{
                uri: uri.href,
                text: `Issue: ${issue.summary} (ID: ${issue.id})\nStatus: ${issue.resolved ? 'Resolved' : 'Open'}\n\nDescription:\n${issue.description || 'No description'}\n\nCustom Fields:\n${customFieldsText}\n\nComments:\n${commentsText}`
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
        } catch (error) {
          return {
            contents: [{
              uri: uri.href,
              text: `Error: ${error.message}`
            }]
          };
        }
      }
    );

    export { server };
