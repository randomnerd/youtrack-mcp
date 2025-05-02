import { config } from 'dotenv';
import fs from 'fs/promises';

// Define interfaces for configurations
interface YouTrackConfig {
  baseUrl: string;
  token: string;
}

// YouTrack API configuration
export const youtrackConfig: YouTrackConfig = {
  baseUrl: process.env.YOUTRACK_URL || 'https://youtrack.example.com/api',
  token: process.env.YOUTRACK_TOKEN || ''
};

export async function loadConfig(): Promise<void> {
  // Try to load from .env file
  config();

  // Update config with environment variables
  youtrackConfig.baseUrl = process.env.YOUTRACK_API_URL || youtrackConfig.baseUrl;
  youtrackConfig.token = process.env.YOUTRACK_API_TOKEN || youtrackConfig.token;

  // Check if config file exists and load it
  try {
    await fs.access('./.env');
    console.log('Configuration loaded from .env file');
  } catch (error) {
    console.log('No .env file found. Using environment variables or defaults.');
    console.log('You can create a .env file based on .env.example');
  }

  // Validate configuration
  if (!youtrackConfig.baseUrl || !youtrackConfig.token) {
    console.warn(
      'WARNING: YouTrack URL or token not configured. Set YOUTRACK_API_URL and YOUTRACK_API_TOKEN environment variables.'
    );
  }
}

/**
 * Updates YouTrack API configuration
 */
export function updateConfig(newConfig: Partial<YouTrackConfig>): void {
  if (newConfig.baseUrl) {
    youtrackConfig.baseUrl = newConfig.baseUrl;
  }
  
  if (newConfig.token) {
    youtrackConfig.token = newConfig.token;
  }
} 