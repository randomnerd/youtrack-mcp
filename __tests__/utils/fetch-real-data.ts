import dotenv from 'dotenv';
import { YouTrack } from '../../src/utils/youtrack';
import * as YouTrackTypes from '../../src/types/youtrack';
import fs from 'fs';
import path from 'path';
import dataAnonymizer from '../helpers/data-anonymizer';

// Define output directory
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'output', 'tests');

// Helper function to log data to a file for analysis
async function saveJsonToFile(data: any, filename: string): Promise<void> {
  const filePath = path.join(OUTPUT_DIR, filename);
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Helper function to anonymize and save data
async function anonymizeAndSaveData(
  data: any,
  filename: string,
  anonymizeFunction: Function
): Promise<any> {
  // Anonymize the data
  const anonymizedData = anonymizeFunction(data);
  
  // Save both raw and anonymized data
  await saveJsonToFile(data, `raw_${filename}`);
  await saveJsonToFile(anonymizedData, filename);
  
  return anonymizedData;
}

async function fetchRealData() {
  // Load environment variables
  dotenv.config();

  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Initialize YouTrack client
  const ytUrl = process.env.YOUTRACK_URL || '';
  const ytToken = process.env.YOUTRACK_TOKEN || '';
  
  const ytClient = new YouTrack(
    ytUrl,
    ytToken,
    process.env.YOUTRACK_DEBUG === 'true',
    parseInt(process.env.YOUTRACK_TIMEOUT || '30000'),
    parseInt(process.env.YOUTRACK_MAX_RETRIES || '3')
  );

  try {
    // Fetch boards data
    const boards = await ytClient.listBoards();
    
    // Save anonymized boards data
    await anonymizeAndSaveData(
      boards, 
      'real-all-boards.json',
      (data: YouTrackTypes.Board[]) =>
        data.map((board) => dataAnonymizer.anonymizeBoard(board))
    );
    
    if (boards.length === 0) {
      return;
    }

    // Find specific board ID 103-83 if available
    const targetBoardId = "103-83";
    const targetBoard = boards.find(board => board.id === targetBoardId);
    
    // Use the found board or fall back to the first board
    const testBoard = targetBoard || boards[0];
    
    // Fetch detailed board info
    const boardDetails = await ytClient.getBoard(testBoard.id);
    
    // Save detailed test board
    await anonymizeAndSaveData(
      boardDetails,
      'real-selected-board.json',
      dataAnonymizer.anonymizeBoard
    );
    
    // Use sprints from the board data instead of making a separate request
    const sprints = boardDetails.sprints || [];
    
    // Save anonymized sprints data
    await anonymizeAndSaveData(
      sprints,
      'real-all-sprints.json',
      (data: YouTrackTypes.Sprint[]) =>
        data.map((sprint) => dataAnonymizer.anonymizeSprint(sprint))
    );
    
    if (sprints.length === 0) {
      return;
    }

    // Select an active sprint if available
    const today = new Date();
    const activeSprints = sprints.filter((sprint) => {
      const startDate = sprint.start ? new Date(sprint.start) : null;
      const endDate = sprint.finish ? new Date(sprint.finish) : null;
      
      return startDate && endDate && startDate <= today && today <= endDate;
    });
    const selectedSprint =
      activeSprints.length > 0 ? activeSprints[0] : sprints[0];
    
    // Add more fields to the sprint request to ensure we get issues
    ytClient.addSprintFields('issues(id,idReadable,summary)');
    
    // Fetch detailed sprint info with expanded issues field
    const sprintDetails = await ytClient.getSprint(
      testBoard.id,
      selectedSprint.id
    );
    
    // Save anonymized sprint data
    await anonymizeAndSaveData(
      sprintDetails,
      'real-current-sprint.json',
      dataAnonymizer.anonymizeSprint
    );
    
    // Fetch issues for the sprint
    let issues: YouTrackTypes.IssueWithActivities[] = [];
    
    // Check if sprint data contains issue IDs we can use directly
    if (sprintDetails.issues && sprintDetails.issues.length > 0) {
      // Limit to maximum 10 issues
      const issueReferences = sprintDetails.issues.slice(0, 10);
      
      // Fetch each issue individually by ID
      for (const issueRef of issueReferences) {
        try {
          const issue = await ytClient.getIssue(issueRef.id);
          issues.push(issue);
        } catch (issueError) {
          // Error handling without console.error
        }
      }
    } else {
      // Fall back to searching by board name
      try {
        issues = await ytClient.searchIssues(`board: ${testBoard.name}`, {
          limit: 20,
        });
      } catch (error) {
        // Just get some recent issues as a fallback
        issues = await ytClient.searchIssues('', { limit: 20 });
      }
    }
    
    // Save anonymized issues
    await anonymizeAndSaveData(
      issues,
      'real-sprint-issues.json',
      (data: YouTrackTypes.Issue[]) =>
        data.map((issue) => dataAnonymizer.anonymizeIssue(issue))
    );
    
    // Get detailed information for a few issues including activities
    if (issues.length > 0) {
      for (let i = 0; i < Math.min(10, issues.length); i++) {
        const issueId = issues[i].id;
        
        // Get detailed issue info (activities are included automatically)
        const issueWithActivities = await ytClient.getIssue(issueId);
        
        // Save anonymized issue with activities
        await anonymizeAndSaveData(
          issueWithActivities,
          `real-issue-${i + 1}-with-activities.json`,
          dataAnonymizer.anonymizeIssueWithActivities
        );
      }
    }
  } catch (error) {
    // Error handling without console.error
  }
}

// Run the function
fetchRealData().catch(() => {}); 