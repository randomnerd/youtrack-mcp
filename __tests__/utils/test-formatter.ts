import fs from 'fs';
import path from 'path';
import { formatIssueForAI } from '../../src/utils/issue-formatter';
import * as YouTrackTypes from '../../src/types/youtrack';
import dotenv from 'dotenv';
import { YouTrack } from '../../src/utils/youtrack';

// Define output directories
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'output', 'formatted');

/**
 * Main test function
 */
async function testFormatter() {
  // Load environment variables
  dotenv.config();
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Initialize YouTrack client
  const ytClient = new YouTrack(
    process.env.YOUTRACK_URL || '',
    process.env.YOUTRACK_TOKEN || '',
    process.env.YOUTRACK_DEBUG === 'true',
    parseInt(process.env.YOUTRACK_TIMEOUT || '30000'),
    parseInt(process.env.YOUTRACK_MAX_RETRIES || '3')
  );
  
  try {
    // Fetch a test issue with activities directly from YouTrack
    
    // Get two test issues
    const issues = await ytClient.searchIssues('', { limit: 2 });
    
    if (issues.length === 0) {
      return;
    }
    
    for (let i = 0; i < issues.length; i++) {
      // Get detailed issue info with activities
      const issueWithActivities = await ytClient.getIssue(issues[i].id);
      
      // Format the issue with our formatter
      const formattedIssue = formatIssueForAI(issueWithActivities, { 
        includeActivities: true,
        maxActivities: 15
      });
      
      // Save the formatted output
      const outputPath = path.join(OUTPUT_DIR, `formatted-issue-${i+1}.txt`);
      fs.writeFileSync(outputPath, formattedIssue);
    }
  } catch (error) {
    // Error handling without console.error
  }
}

// Run the test
testFormatter().catch(() => {}); 