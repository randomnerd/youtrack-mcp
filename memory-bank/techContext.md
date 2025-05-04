# YouTrack MCP Technical Context

## Technologies Used

### Core Framework
- **Node.js**: The runtime environment for the application
- **TypeScript**: For type-safe JavaScript development

### MCP Integration
- **@modelcontextprotocol/sdk**: SDK for implementing the Model Context Protocol
- **McpServer**: Core server implementation from the MCP SDK

### API Integration
- **Axios**: For HTTP requests to the YouTrack API
- **dotenv**: For loading environment variables from .env file

### Validation
- **Zod**: For runtime type validation and schema definition

### Testing
- **Jest**: Testing framework for unit and integration tests
- **axios-mock-adapter**: For mocking HTTP requests in tests
- **Coverage reporting**: Built into Jest for tracking test coverage metrics

## Development Setup

### Environment Variables
The application requires the following environment variables:
- `YOUTRACK_BASE_URL`: Base URL of the YouTrack instance
- `YOUTRACK_TOKEN`: Permanent token for YouTrack API authentication
- `PORT`: Port for the MCP server (optional, default: 3000)

### Installation
```sh
npm install
```

### Running the Application
```sh
npm start
```

### Testing
```sh
# Run all tests
npm test

# Run tests with watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests without type checking
npm run test:no-types
```

## Testing Strategy

### Test Structure
The project uses a comprehensive testing approach with:

1. **Unit Tests** - Located in `__tests__/unit/`
   - Controllers - Testing business logic in isolation
   - Models - Testing data operations with mocked API
   - Routes - Testing route registration, parameter validation, and transformation
   - Utils - Testing utility functions
   - Views - Testing response formatting

2. **Integration Tests** - Located in `__tests__/integration/`
   - Routes - Testing end-to-end route functionality
   - YouTrack API - Testing API client interactions

3. **Test Fixtures** - Located in `__tests__/fixtures/`
   - Mock data for consistent test scenarios

4. **Transform Tests** - Located in `__tests__/unit/routes/*.transform.test.ts`
   - Dedicated tests for Zod schema transformations
   - Isolated validation of transformation behavior
   - Testing of default values and edge cases

### Current Test Coverage
The project has good test coverage in most areas:
- Overall statement coverage: 77.58%
- Overall branch coverage: 59.14%
- Overall function coverage: 86.97%
- Overall line coverage: 80.20%

Areas with strong coverage:
- Models: 98.03% statement coverage, 79.54% branch coverage
- Views: 95.45% statement coverage, 74.62% branch coverage
- Controllers: 92.20% statement coverage, 72.12% branch coverage

Areas needing improvement:
- Routes: 47.72% branch coverage
- Utility formatters: youtrack-json-formatter.ts has 58.57% coverage
- YouTrack API client: youtrack.ts has multiple failing tests

### Testing Patterns
The codebase uses several testing patterns:

1. **Mock External Dependencies** - Using Jest mocks for YouTrack API, controllers, etc.

2. **Test Fixtures** - Reusable mock data for consistent testing

3. **Isolated Unit Testing** - Testing components independently

4. **Integration Testing** - Testing component interactions

5. **Dedicated Transform Testing** - Isolated testing of Zod schema transformations in separate files 

6. **Resource Template Testing** - Testing by verifying instance type and object properties rather than accessing internal URI property directly

7. **Manual Parameter Transformation** - Manually applying expected transformations in tests to simulate what the real MCP server would do, since mock server doesn't run Zod validations

8. **Option Return Mocking** - Returning options from mock implementations to verify transformed values

9. **Comprehensive Test Assertions** - Testing both happy paths and error cases

### Route Testing Strategy
A specialized approach is used for testing routes with parameter transformations:

1. **Separate Transform Tests** - Dedicated test files for schema transformations
2. **Mock Implementation** - Use jest.mockImplementation to capture passed options
3. **Manual Transformation** - Apply transformations directly in tests to simulate MCP server behavior
4. **Object Matching** - Use expect.objectContaining() for complex schema verification
5. **Resource Instance Checking** - Test ResourceTemplate instances using object inspection rather than internal properties

## Technical Constraints

### YouTrack API Limitations
The implementation is constrained by the available YouTrack API endpoints and their behavior.

### MCP Protocol Constraints
The interface must follow the Model Context Protocol specification.

### Type Safety
All interactions with the YouTrack API must be properly typed for safety and correctness.

## Dependencies
All dependencies are managed through npm and defined in package.json. 