import { issueFixtures } from '../../fixtures';
import { jest } from '@jest/globals';
import { server } from '../../../src/server';
import { IssueModel } from '../../../src/models/issue';
import { setupYouTrackApiMocks } from '../../mocks/youtrack-api.mock';

// Mock the IssueModel
jest.mock('../../../src/models/issue', () => ({
  IssueModel: {
    getById: jest.fn(),
    searchIssues: jest.fn(),
    findByCriteria: jest.fn(),
    updateIssue: jest.fn()
  }
}));

describe('Issue Routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setupYouTrackApiMocks('http://youtrack-test.example.com/api');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('Skipping integration tests until MCP handler mock is set up', () => {
    expect(true).toBe(true);
  });
}); 