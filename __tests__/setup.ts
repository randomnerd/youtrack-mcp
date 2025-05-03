import dotenv from 'dotenv';
import axios from 'axios';
import { setupYouTrackApiMocks } from './mocks/youtrack-api.mock';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Setup YouTrack API mocks with the test base URL
const baseUrl = process.env.YOUTRACK_URL || 'https://youtrack-test.example.com/api';
setupYouTrackApiMocks(baseUrl);

// Mock the youtrack-client singleton
jest.mock('../src/youtrack-client', () => {
  const { YouTrack } = jest.requireActual('../src/utils/youtrack');
  const mockClient = new YouTrack(
    process.env.YOUTRACK_URL || 'https://youtrack-test.example.com/api',
    process.env.YOUTRACK_TOKEN || 'test-token',
    process.env.DEBUG === 'true'
  );
  return { __esModule: true, default: mockClient };
});

// Setup global mocks and configurations for tests
jest.setTimeout(10000); // Set default timeout to 10 seconds 