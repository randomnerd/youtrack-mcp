import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Setup global mocks and configurations for tests
jest.setTimeout(10000); // Set default timeout to 10 seconds 