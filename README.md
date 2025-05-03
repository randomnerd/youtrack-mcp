# YouTrack MCP

An MCP (Model-Context Protocol) server for managing YouTrack agile boards and tasks.

## Description

This MCP server provides an interface to interact with a YouTrack instance via the MCP protocol. It allows querying and managing various YouTrack entities like agile boards, sprints, issues, and projects.

## Features

- List and query agile boards
- View sprint details and status
- Search and update issues
- Work with projects

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```
# YouTrack API Configuration
YOUTRACK_URL=https://your-youtrack-instance.example.com/api
YOUTRACK_TOKEN=your-permanent-token-here

# Server Configuration (optional)
LOG_LEVEL=info
DEBUG=false
```

You can obtain a permanent token from your YouTrack instance in your profile settings.

## Usage

Start the server:

```bash
npm start
```

For development with live reloading:

```bash
npm run dev
```

Use an MCP client to connect to the server. The following tools are available:

### Tools

- `youtrack_list_boards` - List all available agile boards
- `youtrack_get_board` - Get details of a specific board by ID
- `youtrack_get_sprint` - Get details of a specific sprint
- `youtrack_list_projects` - List all available projects
- `youtrack_find_projects_by_name` - Find projects by name
- `youtrack_get_issue` - Get details of a specific issue
- `youtrack_update_issue` - Update an existing issue
- `youtrack_search_issues` - Search for issues using YouTrack query syntax
- `youtrack_find_issues_by_criteria` - Find issues by specific criteria
- `youtrack_find_sprints` - Find sprints by board, name, or status

### Resources

The server also provides the following resource templates:

- `youtrack://boards/{boardId?}` - Access board information
- `youtrack://boards/{boardId}/sprints/{sprintId?}` - Access sprint information
- `youtrack://issues/{issueId?}` - Access issue information
- `youtrack://projects/{projectId?}` - Access project information

## Development

### Project Structure

```
├── src/
│   ├── controllers/      # Business logic for handling requests
│   ├── models/           # Data models for interacting with YouTrack API
│   ├── routes/           # Route definitions for MCP tools
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions and helpers
│   ├── views/            # Response formatters
│   ├── index.ts          # Application entry point
│   ├── server.ts         # MCP server setup
│   └── youtrack-client.ts # YouTrack API client
├── __tests__/            # Test files
│   ├── fixtures/         # Test data fixtures
│   ├── helpers/          # Test helper functions
│   ├── integration/      # Integration tests
│   ├── mocks/            # API mocks
│   └── unit/             # Unit tests
```

### Testing

Run all tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## License

MIT
