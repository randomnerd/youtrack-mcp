# YouTrack MCP Server

    An MCP server for managing YouTrack agile boards and tasks. This server provides tools and resources to interact with YouTrack's API, allowing you to manage agile boards, sprints, and issues.

    ## Features

    - View agile boards and their details
    - Manage sprints and track their progress
    - Create, view, and update issues
    - Add comments to issues
    - List projects

    ## Setup

    1. Install dependencies:
       ```
       npm install
       ```

    2. Configure YouTrack connection:
       - Create a `.env` file based on `.env.example`
       - Add your YouTrack URL and permanent token

    3. Run the server:
       ```
       npm run dev
       ```

    4. Test with MCP Inspector:
       ```
       npm run inspect
       ```

    ## Available Tools

    - `configure`: Set YouTrack connection details
    - `list_boards`: List all available agile boards
    - `get_board`: Get details of a specific agile board
    - `get_sprint`: Get details of a specific sprint
    - `get_issue`: Get details of a specific issue
    - `create_issue`: Create a new issue in a project
    - `update_issue`: Update an existing issue
    - `add_comment`: Add a comment to an issue
    - `list_projects`: List all available projects

    ## Available Resources

    - `youtrack://boards/{boardId?}`: View all boards or a specific board
    - `youtrack://boards/{boardId}/sprints/{sprintId?}`: View all sprints in a board or a specific sprint
    - `youtrack://issues/{issueId?}`: View a specific issue

    ## Usage Examples

    ### Configure YouTrack Connection

    ```
    Tool: configure
    Inputs: {
      "baseUrl": "https://youtrack.example.com",
      "token": "perm:your-permanent-token"
    }
    ```

    ### List All Agile Boards

    ```
    Tool: list_boards
    ```

    ### Get Board Details

    ```
    Tool: get_board
    Inputs: {
      "boardId": "123-456"
    }
    ```

    ### Create a New Issue

    ```
    Tool: create_issue
    Inputs: {
      "projectId": "PROJECT-123",
      "summary": "Fix login bug",
      "description": "Users are unable to log in using SSO",
      "customFields": [
        {
          "name": "Priority",
          "value": "High"
        }
      ]
    }
    ```
