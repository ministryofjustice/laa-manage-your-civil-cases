#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */

// Test server startup script that initializes MSW before starting Express
// This ensures MSW runs in the same process as the Express server

import { setupServer } from 'msw/node';
import { apiHandlers } from '../tests/e2e/mocks/handlers/api.js';
import createApp from './app.js';

console.log('🎭 Starting test server with MSW integration...');
console.log('🔍 Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  API_URL: process.env.API_URL,
  API_PREFIX: process.env.API_PREFIX,
  USE_MOCK_API: process.env.USE_MOCK_API,
});

try {
  console.log(`📦 Initializing MSW with ${apiHandlers.length} handlers`);
  const mswServer = setupServer(...apiHandlers);
  mswServer.listen({ onUnhandledRequest: 'warn' });
  console.log('✅ MSW server is running - API calls will be intercepted');

  // Start the Express application
  const app = createApp();
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`🚀 Express server listening on port ${port}`);
  });

  // Clean up MSW on process exit
  process.on('exit', () => {
    console.log('🧹 Shutting down MSW server...');
    mswServer.close();
  });

  process.on('SIGINT', () => {
    console.log('🧹 Shutting down MSW server (SIGINT)...');
    mswServer.close();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('🧹 Shutting down MSW server (SIGTERM)...');
    mswServer.close();
    process.exit(0);
  });
} catch (err) {
  console.error('Startup error:', err);
  process.exit(1);
}

process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', err => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});
