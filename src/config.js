import { config } from 'dotenv';
    import fs from 'fs/promises';

    export let youtrackConfig = {
      baseUrl: process.env.YOUTRACK_URL || '',
      token: process.env.YOUTRACK_TOKEN || ''
    };

    export async function loadConfig() {
      // Try to load from .env file
      config();
      
      // Update config with environment variables
      youtrackConfig.baseUrl = process.env.YOUTRACK_URL || youtrackConfig.baseUrl;
      youtrackConfig.token = process.env.YOUTRACK_TOKEN || youtrackConfig.token;
      
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
        console.warn('WARNING: YouTrack URL or token not configured. Set YOUTRACK_URL and YOUTRACK_TOKEN environment variables.');
      }
    }

    export function updateConfig(newConfig) {
      youtrackConfig = { ...youtrackConfig, ...newConfig };
      return youtrackConfig;
    }
