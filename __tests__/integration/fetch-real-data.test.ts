import dotenv from 'dotenv';
import { YouTrack } from '../../src/utils/youtrack';
import * as YouTrackTypes from '../../src/types/youtrack';
import fs from 'fs';
import path from 'path';
import dataAnonymizer from '../helpers/data-anonymizer';

// Disable axios mock adapter for this test
jest.mock('axios-mock-adapter', () => {
  return function() {
    return {
      onGet: () => ({ reply: () => {} }),
      onPost: () => ({ reply: () => {} }),
      onPut: () => ({ reply: () => {} }),
      onDelete: () => ({ reply: () => {} }),
      reset: () => {}
    };
  };
});

// Load environment variables from .env.test
dotenv.config({ path: '.env.test' });

// Define test output directory
const TEST_OUTPUT_DIR = path.join(__dirname, '..', '..', 'output', 'tests');

describe('YouTrack Real API Data Fetch', () => {
  let ytClient: YouTrack;
  
  beforeAll(() => {
    // Initialize YouTrack client with real credentials from .env.test
    ytClient = new YouTrack(
      process.env.YOUTRACK_URL || '',
      process.env.YOUTRACK_TOKEN || '',
      process.env.YOUTRACK_DEBUG === 'true',
      parseInt(process.env.YOUTRACK_TIMEOUT || '10000'),
      parseInt(process.env.YOUTRACK_MAX_RETRIES || '3')
    );
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
    }
  });
  
  // Helper function to log data to a file for analysis
  async function saveJsonToFile(data: any, filename: string): Promise<void> {
    const filePath = path.join(TEST_OUTPUT_DIR, filename);
    await fs.promises.writeFile(
      filePath,
      JSON.stringify(data, null, 2),
      'utf8'
    );
    console.log(`Data saved to ${filePath}`);
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
  
  test.skip('Fetch and save anonymized board data', async () => {
    // Fetch real boards data
    const boards = await ytClient.listBoards();
    expect(boards.length).toBeGreaterThan(0);
    
    // Save anonymized boards data
    const anonymizedBoards = await anonymizeAndSaveData(
      boards, 
      'real-all-boards.json',
      (data: YouTrackTypes.Board[]) => data.map(board => dataAnonymizer.anonymizeBoard(board))
    );
    
    // Find a board to work with (use first board if available)
    const testBoard = boards[0];
    expect(testBoard).toBeDefined();
    console.log(`Using board: ${testBoard.name} (ID: ${testBoard.id})`);
    
    // Fetch detailed board info
    const boardDetails = await ytClient.getBoard(testBoard.id);
    
    // Save detailed test board
    const anonymizedBoard = await anonymizeAndSaveData(
      boardDetails,
      'real-selected-board.json',
      dataAnonymizer.anonymizeBoard
    );
    
    // Fetch sprints for the board
    const sprints = await ytClient.findSprints({ boardId: testBoard.id });
    expect(sprints.length).toBeGreaterThan(0);
    
    // Save anonymized sprints data
    await anonymizeAndSaveData(
      sprints,
      'real-all-sprints.json',
      (data: YouTrackTypes.Sprint[]) => data.map(sprint => dataAnonymizer.anonymizeSprint(sprint))
    );
    
    // Select an active sprint if available
    const activeSprints = sprints.filter(sprint => !sprint.archived);
    const selectedSprint = activeSprints.length > 0 ? activeSprints[0] : sprints[0];
    expect(selectedSprint).toBeDefined();
    console.log(`Using sprint: ${selectedSprint.name} (ID: ${selectedSprint.id})`);
    
    // Fetch detailed sprint info
    const sprintDetails = await ytClient.getSprint(testBoard.id, selectedSprint.id);
    
    // Save anonymized sprint data
    const anonymizedSprint = await anonymizeAndSaveData(
      sprintDetails,
      'real-current-sprint.json',
      dataAnonymizer.anonymizeSprint
    );
    
    // Fetch issues for the sprint
    const sprintQuery = `sprint: {${selectedSprint.name}}`;
    const issues = await ytClient.searchIssues(sprintQuery, { limit: 20 });
    expect(issues.length).toBeGreaterThan(0);
    
    // Save anonymized issues
    const anonymizedIssues = await anonymizeAndSaveData(
      issues,
      'real-sprint-issues.json',
      (data: YouTrackTypes.Issue[]) => data.map(issue => dataAnonymizer.anonymizeIssue(issue))
    );
    
    // Get detailed information for a few issues including activities
    if (issues.length > 0) {
      for (let i = 0; i < Math.min(3, issues.length); i++) {
        const issueId = issues[i].id;
        // Get detailed issue info (activities are included automatically)
        const issueWithActivities = await ytClient.getIssue(issueId);
        
        // Save anonymized issue with activities
        await anonymizeAndSaveData(
          issueWithActivities,
          `real-issue-${i+1}-with-activities.json`,
          dataAnonymizer.anonymizeIssueWithActivities
        );
      }
    }
  }, 60000); // Set timeout to 60 seconds for this test
}); 