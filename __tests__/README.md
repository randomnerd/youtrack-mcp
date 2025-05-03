# YouTrack MCP Testing

This directory contains tests for the YouTrack MCP project, including fixtures and mocks based on real API data.

## Directory Structure

- `fixtures/`: Contains test fixtures (sample data) for boards, issues, projects, sprints, and activities
- `mocks/`: Contains mock implementations (like the YouTrack API mock)
- `helpers/`: Test helper functions
- `integration/`: Integration tests
- `unit/`: Unit tests for controllers, models, routes, utils, and views

## Working with Fixtures and Mocks

The fixtures and mocks in this project are based on real API data collected from YouTrack. This ensures tests are using realistic data structures.

### Fixtures

Available fixtures:

- `boardFixtures`: Board data including a real "Payments DEV-Sprint" board
- `issueFixtures`: Issue data including real issues from the payment project
- `sprintFixtures`: Sprint data including a real sprint with start and end dates
- `projectFixtures`: Project data
- `activityFixtures`: Activity data for issues

### Mocks

The YouTrack API mock intercepts axios requests to simulate the YouTrack API. It uses the fixture data to provide consistent test responses.

### Generating New Fixtures

To update fixtures with fresh data from the YouTrack API:

1. Run the test script to collect real API data:
   ```
   node -r ts-node/register test-youtrack-api.ts
   ```

2. Run the formatter test to see how the data is formatted:
   ```
   node -r ts-node/register test-issue-formatter.ts
   ```

3. Check the output directory for the raw JSON data
4. Update the fixture files with new data as needed

## Running Tests

Run all tests:
```
npm test
```

Run specific test files:
```
npm test -- <test-file-path>
```

Run tests with coverage:
```
npm run test:coverage
``` 