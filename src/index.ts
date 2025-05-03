#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { server } from './server';
import debug from 'debug';

const serverDebug = debug('youtrack:server');

serverDebug('Starting YouTrack MCP server...');

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
server
  .connect(transport)
  .then(() => {
    serverDebug('YouTrack MCP server started');
  })
  .catch((err) => {
    console.error('Failed to start YouTrack MCP server:', err);
    process.exit(1);
  });

export { YouTrack } from './utils/youtrack';
export * as YouTrackJsonFormatter from './utils/youtrack-json-formatter';
export * as YouTrackTypes from './types/youtrack';
