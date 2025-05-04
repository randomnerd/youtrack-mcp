# YouTrack MCP Technical Context

## Technology Stack

### Core Technologies
- **Node.js**: Runtime environment
- **TypeScript**: Programming language for type safety
- **MCP SDK**: `@modelcontextprotocol/sdk` for implementing the MCP server
- **Axios**: HTTP client for YouTrack API communication
- **Zod**: Schema validation library
- **dotenv**: Environment variable management
- **debug**: Debugging utility

### Development Tools
- **Jest**: Testing framework
- **ts-jest**: TypeScript support for Jest
- **Supertest**: HTTP assertions for testing
- **axios-mock-adapter**: Mock HTTP requests for testing

## Development Setup

### Prerequisites
- Node.js (v16+)
- npm or yarn
- A YouTrack instance with API access

### Local Environment
1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env` file with:
   ```
   YOUTRACK_URL=https://your-youtrack-instance.example.com/api
   YOUTRACK_TOKEN=your-permanent-token-here
   LOG_LEVEL=info
   DEBUG=false
   ```
4. Build the project with `npm run build`
5. Start the server with `npm start` or `npm run dev` for development mode

### Configuration Options
- **YOUTRACK_URL**: Base URL of YouTrack API
- **YOUTRACK_TOKEN**: Permanent token for authentication
- **LOG_LEVEL**: Logging level (debug, info, warn, error)
- **DEBUG**: Enable detailed debug logging

## Technical Constraints

### API Limitations
- YouTrack API rate limits must be respected
- Some operations may require specific permissions in YouTrack
- Response structure from YouTrack API can be complex and deeply nested

### MCP Protocol Constraints
- JSON-only communication
- Stateless operation
- Limited to defined tool schemas
- Responses must match expected schema

## Dependencies

### External Dependencies
- **YouTrack API**: All operations depend on a valid YouTrack instance
- **MCP Inspector**: For testing and debugging tool calls

### Internal Dependencies
1. **Server → Routes**: Server depends on route registrations
2. **Routes → Controllers**: Routes depend on controller functions
3. **Controllers → Models**: Controllers use models to access YouTrack
4. **Models → YouTrack Client**: Models depend on YouTrack client
5. **Views → Utils**: Views use formatter utilities

## Build & Deployment

### Build Process
1. TypeScript compilation via `tsc`
2. Output to `build/` directory

### Running Modes
- **Production**: `npm start`
- **Development**: `npm run dev` (with auto-restart)
- **Inspection**: `npm run inspect` (with MCP inspector)

### Testing Strategy
- **Unit Tests**: Controllers, models, and utilities
- **Integration Tests**: End-to-end tool calls
- **Test Data**: Fixtures for consistent test scenarios 