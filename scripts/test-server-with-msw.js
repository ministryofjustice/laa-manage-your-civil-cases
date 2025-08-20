#!/usr/bin/env node

/**
 * Test Server with MSW Patching
 * 
 * This script patches Node.js HTTP modules with MSW and then starts
 * the regular Express application. The Express app remains completely
 * unaware of MSW - it makes normal API calls that get intercepted
 * transparently at the Node.js level.
 * 
 * This ONLY runs during Playwright tests, not during normal development.
 */

import { setupServer } from 'msw/node';
import { apiHandlers } from '../tests/e2e/mocks/handlers/api.js';

console.log('🎭 Starting test server with MSW Node.js HTTP patching...');
console.log('🔍 Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT || 3001,
  API_URL: process.env.API_URL,
});

try {
  // STEP 1: Patch Node.js HTTP modules with MSW
  console.log(`🔧 Patching Node.js HTTP stack with ${apiHandlers.length} MSW handlers`);
  const mswServer = setupServer(...apiHandlers);
  mswServer.listen({ 
    onUnhandledRequest: 'warn' 
  });
  console.log('✅ MSW patching active - HTTP requests will be intercepted transparently');

  // STEP 2: Start the regular Express app (unchanged)
  console.log('🚀 Starting Express application...');
  const { default: createApp } = await import('../src/app.js');
  const app = createApp();
  const port = process.env.PORT || 3001;

  app.listen(port, () => {
    console.log(`🌐 Express server ready on port ${port}`);
    console.log('� Express will make normal API calls, MSW will intercept them');
  });

  // STEP 3: Graceful shutdown handling
  const shutdown = () => {
    console.log('🧹 Shutting down MSW patching...');
    mswServer.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

} catch (err) {
  console.error('� Failed to start test server with MSW patching:', err);
  process.exit(1);
}

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception in test server:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection in test server:', err);
  process.exit(1);
});
