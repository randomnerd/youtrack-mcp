#!/usr/bin/env node
    import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
    import { server } from './server.js';
    import { loadConfig } from './config.js';

    // Load configuration
    await loadConfig();

    console.log('Starting YouTrack MCP server...');

    // Start receiving messages on stdin and sending messages on stdout
    const transport = new StdioServerTransport();
    await server.connect(transport);
