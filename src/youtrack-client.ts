import { YouTrack } from './utils/youtrack';
import dotenv from 'dotenv';
import debug from 'debug';

const clientDebug = debug('youtrack:client');

// Define interfaces for configuration
interface YouTrackConfig {
  baseUrl: string;
  token: string;
  timeout?: number;
  maxRetries?: number;
}

// Load environment variables
dotenv.config();

// Validate configuration
const baseUrl = process.env.YOUTRACK_URL;
const token = process.env.YOUTRACK_TOKEN;
const timeout = process.env.REQUEST_TIMEOUT ? parseInt(process.env.REQUEST_TIMEOUT, 10) : 10000; // Default 10s timeout
const maxRetries = process.env.MAX_RETRIES ? parseInt(process.env.MAX_RETRIES, 10) : 3; // Default 3 retries

const configErrors: string[] = [];

if (!baseUrl) {
  configErrors.push('YouTrack URL not configured. Set YOUTRACK_URL in your .env file.');
}

if (!token) {
  configErrors.push('YouTrack API token not set. Set YOUTRACK_TOKEN in your .env file.');
}

// Create a YouTrack client or a proxy that throws errors
let youtrackClient: YouTrack;

// Handle missing configuration
if (configErrors.length > 0) {
  const errorMessage = configErrors.join(' ');
  console.error(`ERROR: ${errorMessage}`);
  clientDebug(`Configuration errors: ${errorMessage}`);
  
  // Create a proxy that throws an error when any method is called
  // This prevents errors at import time but provides clear errors when methods are called
  const mockHandler = {
    get: (_target: object, prop: string | symbol) => {
      if (typeof prop === 'string' && prop !== 'then') {
        return () => {
          throw new Error(`Cannot call YouTrack API: ${errorMessage}`);
        };
      }
      return undefined;
    }
  };
  
  // Create a mock instance with the same constructor signature
  const mockClient = new YouTrack('', '', false, 0, 0);
  // Override with proxy
  youtrackClient = new Proxy(mockClient, mockHandler) as YouTrack;
} else {
  // Initialize YouTrack client with validated configuration
  youtrackClient = new YouTrack(baseUrl!, token!, process.env.DEBUG === 'true', timeout, maxRetries);
}

export default youtrackClient;
