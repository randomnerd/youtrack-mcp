import { Youtrack } from 'youtrack-rest-client';
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
  baseUrl: process.env.YOUTRACK_API_URL || process.env.YOUTRACK_URL || 'https://youtrack.example.com',
  token: process.env.YOUTRACK_API_TOKEN || process.env.YOUTRACK_TOKEN || ''
};

// Validate configuration
if (!youtrackConfig.baseUrl || youtrackConfig.baseUrl === 'https://youtrack.example.com') {
  console.warn('WARNING: YouTrack URL not properly configured. Set YOUTRACK_API_URL in your .env file.');
}

if (!youtrackConfig.token) {
  console.warn('WARNING: YouTrack API token not set. Set YOUTRACK_API_TOKEN in your .env file.');
}

// Initialize YouTrack client
const youtrackClient = new Youtrack(youtrackConfig);

console.log(`Configured YouTrack client with base URL: ${youtrackConfig.baseUrl}`);

export default youtrackClient; 