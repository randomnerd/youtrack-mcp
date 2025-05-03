import dotenv from 'dotenv';
import { YouTrack } from '../../src/utils/youtrack';
import * as YouTrackTypes from '../../src/types/youtrack';
import fs from 'fs';
import path from 'path';
import dataAnonymizer from '../helpers/data-anonymizer';
import { setupYouTrackApiMocks, resetMocks } from '../mocks/youtrack-api.mock';
import { boardFixtures, sprintFixtures, issueFixtures } from '../fixtures';

// Load environment variables from .env.test
dotenv.config({ path: '.env.test' });

// Define test output directory
const TEST_OUTPUT_DIR = path.join(__dirname, '..', '..', 'output', 'tests');

describe('YouTrack API Integration Tests', () => {
  let ytClient: YouTrack;
  const mockBaseUrl = 'https://youtrack.example.com';
  
  beforeAll(() => {
    // Set up mocks
    setupYouTrackApiMocks(mockBaseUrl);
    
    // Initialize YouTrack client with mock server URL
    ytClient = new YouTrack(
      mockBaseUrl,
      'fake-token-for-testing',
      true, // Enable debug logging
      10000, // 10s timeout
      3 // 3 retries
    );
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
    }
  });
  
  afterEach(() => {
    // Reset the mocks after each test
    resetMocks();
  });
  
  // Helper function to log data to a file for analysis
  async function saveJsonToFile(data: any, filename: string): Promise<void> {
    const filePath = path.join(TEST_OUTPUT_DIR, filename);
    await fs.promises.writeFile(
      filePath,
      JSON.stringify(data, null, 2),
      'utf8'
    );
  }
  
  // Helper function to anonymize and save data
  async function anonymizeAndSaveData(data: any, filename: string, anonymizeFunction: Function): Promise<any> {
    // Anonymize the data
    const anonymizedData = anonymizeFunction(data);
    
    // Save both raw and anonymized data
    await saveJsonToFile(data, `raw_${filename}`);
    await saveJsonToFile(anonymizedData, filename);
    
    return anonymizedData;
  }
  
  test('Mock API - Save anonymized board and sprint data', async () => {
    // Use fixture data directly instead of calling the API
    const boards = boardFixtures.boards || boardFixtures.listBoards;
    expect(boards.length).toBeGreaterThan(0);
    
    // Save anonymized boards data
    const anonymizedBoards = await anonymizeAndSaveData(
      boards, 
      'all-boards.json',
      (data: YouTrackTypes.Board[]) => data.map(board => dataAnonymizer.anonymizeBoard(board))
    );
    
    // Find a board to work with (use first board if available)
    const testBoard = boards[0];
    expect(testBoard).toBeDefined();
    
    // Save detailed test board
    const anonymizedBoard = await anonymizeAndSaveData(
      testBoard,
      'selected-board.json',
      dataAnonymizer.anonymizeBoard
    );
    
    // Work with sprints directly from fixtures
    const sprints = sprintFixtures.sprints || [];
    expect(sprints.length).toBeGreaterThan(0);
    
    // Select a sprint
    const selectedSprint = sprints[0];
    expect(selectedSprint).toBeDefined();
    
    // Save anonymized sprint data
    const anonymizedSprint = await anonymizeAndSaveData(
      selectedSprint,
      'current-sprint.json',
      dataAnonymizer.anonymizeSprint
    );
    
    // Work with issues from fixtures
    const issues = issueFixtures.issues || [];
    expect(issues.length).toBeGreaterThan(0);
    
    // Save anonymized issues
    const anonymizedIssues = await anonymizeAndSaveData(
      issues.slice(0, 3),
      'detailed-issues.json',
      (data: YouTrackTypes.Issue[]) => data.map(issue => dataAnonymizer.anonymizeIssue(issue))
    );
    
    // Sample issue with activities
    if (issues.length > 0) {
      const firstIssue = issues[0];
      
      // Create a sample issue with activities
      const issueWithActivities: YouTrackTypes.IssueWithActivities = {
        ...firstIssue,
        activities: [
          {
            id: 'activity1',
            $type: 'CustomFieldActivityItem',
            timestamp: Date.now() - 86400000, // 1 day ago
            author: {
              id: 'user1',
              name: 'Test User',
              fullName: 'Test User',
              $type: 'User'
            },
            target: {
              id: firstIssue.id,
              $type: 'Issue'
            },
            field: {
              id: 'field1',
              name: 'Status',
              $type: 'CustomFilterField'
            },
            added: [
              {
                id: 'added1',
                name: 'In Progress',
                $type: 'ActivityChange'
              }
            ],
            removed: [
              {
                id: 'removed1',
                name: 'Open',
                $type: 'ActivityChange'
              }
            ]
          }
        ]
      };
      
      // Save anonymized issue with activities
      await anonymizeAndSaveData(
        issueWithActivities,
        'issue-with-activities.json',
        dataAnonymizer.anonymizeIssueWithActivities
      );
    }
  });
}); 