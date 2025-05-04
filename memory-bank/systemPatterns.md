# YouTrack MCP System Patterns

## Architecture Overview

The YouTrack MCP server follows a layered architecture pattern:

```
┌─────────────┐
│ MCP Server  │ - Handles MCP protocol interface and tool registration
└─────┬───────┘
      │
┌─────┴───────┐
│   Routes    │ - Defines tool endpoints and resource templates
└─────┬───────┘
      │
┌─────┴───────┐
│ Controllers │ - Contains business logic for handling requests
└─────┬───────┘
      │
┌─────┴───────┐
│   Models    │ - Interacts with YouTrack API
└─────┬───────┘
      │
┌─────┴───────┐
│    Views    │ - Formats responses for clients
└─────────────┘
```

## Key Design Patterns

### 1. MVC-Inspired Pattern
- **Models**: Data access layer interacting with YouTrack API
- **Views**: Response formatters for standardizing outputs
- **Controllers**: Business logic processing requests and responses
- **Routes**: Mapping MCP tools to controller functions

### 2. Adapter Pattern
- The YouTrack client adapts the external YouTrack API to match the internal application needs
- The JSON formatter adapts complex YouTrack responses to simplified structures

### 3. Factory Pattern
- Tools are registered via factory functions that generate the appropriate handlers
- Resource templates are created as factories producing resource URLs

### 4. Strategy Pattern
- Different formatting strategies based on entity types (issues, boards, sprints, projects)
- Configurable formatting options through strategy parameters

## Component Relationships

1. **MCP Server** (`server.ts`)
   - Core server that implements the MCP protocol
   - Registers all tools and resource templates

2. **Routes** (`routes/*.ts`)
   - Define tool endpoints, parameters, and handlers
   - Connect tools to appropriate controllers

3. **Controllers** (`controllers/*.ts`)
   - Contain business logic for processing requests
   - Coordinate between models and views

4. **Models** (`models/*.ts`, `youtrack-client.ts`)
   - Handle data access to YouTrack API
   - Perform validation and error handling

5. **Views** (`views/*.ts`, `utils/youtrack-json-formatter.ts`)
   - Format responses from YouTrack API into standardized structures
   - Apply transformation rules to simplify data

6. **Utils** (`utils/*.ts`)
   - Common utilities and helper functions
   - Configuration and environment handling

## Data Flow

1. Client makes a tool call via MCP protocol
2. Server routes the request to the appropriate handler
3. Controller processes the request, performing validation
4. Model executes the request against YouTrack API
5. Response data is passed to view for formatting
6. Formatted response is returned to client 