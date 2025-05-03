import { YouTrack } from './utils/youtrack';
import dotenv from 'dotenv';

// Define interfaces for configuration
interface YouTrackConfig {
  baseUrl: string;
  token: string;
}

// Load environment variables
dotenv.config();

// YouTrack API client configuration
const youtrackConfig: YouTrackConfig = {
  baseUrl: process.env.YOUTRACK_URL!,
  token: process.env.YOUTRACK_TOKEN!,
};

// Validate configuration
if (!youtrackConfig.baseUrl) {
  console.warn(
    'WARNING: YouTrack URL not properly configured. Set YOUTRACK_API_URL in your .env file.'
  );
}

if (!youtrackConfig.token) {
  console.warn(
    'WARNING: YouTrack API token not set. Set YOUTRACK_API_TOKEN in your .env file.'
  );
}

if (!youtrackConfig.baseUrl || !youtrackConfig.token) {
  throw new Error(
    'YouTrack URL or token not configured. Set YOUTRACK_URL and YOUTRACK_TOKEN environment variables.'
  );
}

// Initialize YouTrack client
const youtrackClient = new YouTrack(
  youtrackConfig.baseUrl,
  youtrackConfig.token
);

export default youtrackClient;


async function test() {
  // const sprint = await youtrackClient.getSprint('103-83', '104-441');
  // console.log(JSON.stringify(sprint, null, 2));
  const issue = await youtrackClient.getIssue('P-3386');
  console.log(JSON.stringify(issue, null, 2));
}

test();
