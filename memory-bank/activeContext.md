# YouTrack MCP Active Context

## Current Focus
The project is currently focused on improving test coverage, particularly for route files and the YouTrack client. We have successfully fixed the failing tests in the `sprintRoutes.test.ts` file, but still have issues with `issueRoutes.test.ts` and many failing tests in `youtrack.test.ts`.

## Recent Changes
1. Fixed the `sprintRoutes.test.ts` tests by properly handling ResourceTemplate access and implementing correct testing for Zod schema transformations
2. Created a dedicated `sprintRoutes.transform.test.ts` file to test transform functions independently
3. Updated testing approach for transformed parameters by manually applying the transformations in tests to match real-world behavior
4. Fixed resource template URI test by properly checking ResourceTemplate instances
5. Applied a pattern of returning options in mock implementations to verify transformed values
6. Created a more comprehensive testing strategy for route parameter validations

## Active Decisions
1. **Test Improvement Strategy**: Focus on critical failing tests first, then improve coverage for complex components
2. **Route Test Strategy**: Use dedicated transform test files to test schema transformations independently from route functionality
3. **Mock Strategy**: Return options from mock implementations to verify transformed values
4. **ResourceTemplate Testing**: Use object instance checking rather than trying to access internal URI property
5. **Coverage Goals**: Continue targeting improved coverage in statement, branch, and function metrics with focus on utility files
6. **Test vs. Implementation**: Adapt tests to match implementation where implementation is correct, and update implementation where tests had valid expectations
7. **Transform Testing Pattern**: Manually apply transformations in tests to simulate what the real MCP server would do, as the mock server doesn't run Zod validations

## Next Steps
1. Apply the same fixes we made to `sprintRoutes.test.ts` to `issueRoutes.test.ts`, which is failing with similar issues
2. Fix failing tests in `youtrack.test.ts` related to API error handling
3. Further enhance test coverage for `youtrack-json-formatter.ts` (currently around 58.57%)
4. Continue improving branch coverage for route files (currently at 47.72%)
5. Focus on improving branch coverage across the project which is still the weakest metric at 59.14%

## Current Challenges
1. **YouTrack API Client Tests**: The `youtrack.test.ts` file has numerous failing tests related to error handling and API response mocking
2. **Issue Routes Tests**: The `issueRoutes.test.ts` file still has failing tests related to parameter transformations (same issues we fixed in sprint routes)
3. **Complex Formatter Coverage**: The `youtrack-json-formatter.ts` utility has relatively low coverage (~58.57%)
4. **Testing Error Handling**: Need more edge case tests to exercise error handling paths
5. **Branch Coverage**: Still relatively low at 59.14% project-wide

## Open Questions
1. How should we approach fixing the YouTrack API client tests? Many of them are failing with similar "YouTrack API Error (404): undefined" errors.
2. Should we refactor the error handling in the YouTrack client to make it more testable?
3. Is our current approach to testing route parameter transformations the best option, or should we consider a different strategy?
4. Should we break down complex formatters like `youtrack-json-formatter.ts` into smaller, more testable units?
5. What patterns can we establish for mocking YouTrack API responses consistently across tests? 