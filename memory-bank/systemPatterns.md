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

## Testing Patterns

### 1. Unit Testing Approach
- **Controller Tests**: Mock models, test business logic in isolation
- **Model Tests**: Mock API responses, test data handling
- **View Tests**: Test formatting logic with mock data
- **Route Tests**: Split into component and integration tests
  - Component tests: Test parameter validation and transformations in isolation
  - Integration tests: Test full request-response flow with mocked dependencies

### 2. Route Testing Strategy
- **Parameter Validation**: Dedicated transform test files test schema transformations independently
- **Parameter Transformation**: Manually apply expected transformations in tests to verify controller receives correct values
- **Resource Templates**: Test by checking instance types rather than internal properties
- **Mock Implementation**: Return received parameters from mocks to verify transformed values
- **Schema Verification**: Use expect.objectContaining() to verify complex schemas

### 3. Zod Schema Testing
- **Dedicated Files**: Each route file has a corresponding `.transform.test.ts` file 
- **Schema Construction**: Recreate schemas from route files for isolated testing
- **Direct Schema Testing**: Test schema validation and transformation using `parse()` method
- **Edge Case Testing**: Test undefined values, minimums, maximums, and invalid inputs
- **Default Values**: Verify default values are properly applied
- **Complex Objects**: Test transformations on complete objects with multiple fields

### 4. Mock Server Testing
- **Mocked Server**: Create a minimal mock of McpServer with jest.fn() methods
- **Handler Extraction**: Extract registered handlers from mock server calls
- **Direct Handler Invocation**: Call handlers directly with test parameters
- **Parameter Capture**: Use mockImplementation to capture and inspect parameters
- **Pre-transformation**: Apply transformations manually before calling handlers since mock server doesn't run Zod validations

### 5. ResourceTemplate Testing
- **Instance Checking**: Verify objects are instances of ResourceTemplate
- **Object Inspection**: Check object properties rather than internal URI property
- **Function Verification**: Verify handler functions are properly registered
- **URI Variables**: Test different combinations of URI variables for resource handlers

### 6. Error Handling Testing
- **Error Mocking**: Mock rejections to test error handling
- **Error Propagation**: Verify errors are properly propagated
- **Custom Error Formats**: Test special error response formats
- **Edge Cases**: Test boundary conditions and validation failures

### 7. Integration Testing
- Test real interactions between layers (controllers calling models, etc.)
- Mock external dependencies (YouTrack API)
- Verify expected behaviors under different scenarios
- Use fixtures for consistent test data

### 8. Test Isolation
- Reset mocks between tests
- Use beforeEach/afterEach for setup/teardown
- Avoid test interdependencies 