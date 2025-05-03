import fs from 'fs';
import path from 'path';
import { formatYouTrackData } from '../../src/utils/youtrack-json-formatter';

// Define test fixture paths
const FIXTURES_DIR = path.join(__dirname, '../fixtures');

/**
 * Save formatted data to output file
 * @param data - Data to save
 * @param filename - Output filename
 */
function saveOutput(data: any, filename: string): void {
  const outputDir = path.join(__dirname, '../../output/formatted');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = path.join(outputDir, filename);
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`Output saved to ${outputPath}`);
}

/**
 * Load fixture data
 * @param filename - Fixture filename
 * @returns Parsed JSON data
 */
function loadFixture(filename: string): any {
  try {
    const filePath = path.join(FIXTURES_DIR, filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading fixture: ${filename}`, error);
    return null;
  }
}

/**
 * Format and save issue data
 */
function formatIssue(): void {
  const issueData = loadFixture('issue.json');
  if (!issueData) {
    console.error('No issue data found');
    return;
  }
  
  console.log('Formatting issue data...');
  const formatted = formatYouTrackData(issueData);
  saveOutput(formatted, 'issue.json');
}

/**
 * Format and save sprint data
 */
function formatSprint(): void {
  const sprintData = loadFixture('sprint.json');
  if (!sprintData) {
    console.error('No sprint data found');
    return;
  }
  
  console.log('Formatting sprint data...');
  const formatted = formatYouTrackData(sprintData);
  saveOutput(formatted, 'sprint.json');
}

/**
 * Format and save board data
 */
function formatBoard(): void {
  const boardData = loadFixture('board.json');
  if (!boardData) {
    console.error('No board data found');
    return;
  }
  
  console.log('Formatting board data...');
  const formatted = formatYouTrackData(boardData);
  saveOutput(formatted, 'board.json');
}

/**
 * Format multiple issues
 */
function formatIssues(): void {
  const issuesData = loadFixture('issues.json');
  if (!issuesData || !Array.isArray(issuesData)) {
    console.error('No issues data found or not an array');
    return;
  }
  
  console.log('Formatting issues data...');
  const formatted = formatYouTrackData(issuesData);
  saveOutput(formatted, 'issues.json');
}

// Main function to run the formatter examples
async function main(): Promise<void> {
  try {
    // Check if fixtures exist and try to load them
    if (!fs.existsSync(FIXTURES_DIR)) {
      console.error(`Fixtures directory not found: ${FIXTURES_DIR}`);
      return;
    }
    
    // Format different entity types
    if (fs.existsSync(path.join(FIXTURES_DIR, 'issue.json'))) {
      formatIssue();
    }
    
    if (fs.existsSync(path.join(FIXTURES_DIR, 'sprint.json'))) {
      formatSprint();
    }
    
    if (fs.existsSync(path.join(FIXTURES_DIR, 'board.json'))) {
      formatBoard();
    }
    
    if (fs.existsSync(path.join(FIXTURES_DIR, 'issues.json'))) {
      formatIssues();
    }
    
    console.log('Formatting complete!');
  } catch (error) {
    console.error('Error running formatters:', error);
  }
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 