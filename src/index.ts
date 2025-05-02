#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { server } from './server.js';

console.log('Starting YouTrack MCP server...');

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
server
  .connect(transport)
  .then(() => {
    console.log('YouTrack MCP server started');
  })
  .catch((err) => {
    console.error('Failed to start YouTrack MCP server:', err);
    process.exit(1);
  });
