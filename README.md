# YouTrack MCP Server

An MCP (Model Context Protocol) server for interacting with YouTrack issue tracker.

## Features

- View and manage YouTrack agile boards
- View and manage sprints
- View, create, and update issues
- Add comments to issues
- List projects

## Installation

1. Clone the repository:
```
git clone <repository-url>
cd youtrack-mcp
```

2. Install dependencies:
```
npm install
```

3. Create a `.env` file based on the `.env.example` file:
```
cp .env.example .env
```

4. Edit the `.env` file and add your YouTrack URL and API token:
```
YOUTRACK_API_URL=https://youtrack.your-company.com
YOUTRACK_API_TOKEN=your-permanent-token
```

## Usage

### Running the server

```
npm start
```

Or you can use the provided start script:

```
./start.sh
```

### Configuration

The server requires the following environment variables:

- `YOUTRACK_API_URL` - The base URL of your YouTrack instance
- `YOUTRACK_API_TOKEN` - Your permanent API token for accessing YouTrack

You can generate a permanent token from your YouTrack profile settings.

## Development

The server uses the `youtrack-rest-client` library to interact with the YouTrack API. You can explore the library's documentation for more information on available methods and functionality.

## API Documentation

The server provides the following MCP tools and resources:

### Tools

- `youtrack_list_boards` - List all agile boards
- `youtrack_get_board` - Get details of a specific agile board
- `youtrack_get_sprint` - Get details of a specific sprint
- `youtrack_get_issue` - Get issue details in an AI-friendly format
- `youtrack_get_issue_old` - Get raw issue details
- `youtrack_create_issue` - Create a new issue
- `youtrack_update_issue` - Update an existing issue
- `youtrack_add_comment` - Add a comment to an issue
- `youtrack_list_projects` - List all projects

### Resources

- `youtrack://boards/{boardId?}` - View all boards or a specific board
- `youtrack://boards/{boardId}/sprints/{sprintId?}` - View sprints for a board or a specific sprint
- `youtrack://issues/{issueId?}` - View a specific issue

## License

MIT
