/**
 * Test Server with MSW Integration
 * 
 * This script starts the actual Express application with MSW enabled for E2E testing.
 * It initializes MSW to intercept outgoing API calls and serve mock responses.
 */

import { setupServer } from 'msw/node';
import { handlers } from '../tests/e2e/mocks/handlers/index.js';

console.log('🎭 Starting Express app with MSW integration...');

// Initialize MSW before importing the app
const mswServer = setupServer(...handlers);

// Enable request interception
mswServer.listen({ 
  onUnhandledRequest: 'warn'
});

console.log('✅ MSW server initialized with', handlers.length, 'handlers');

// Set environment variables for the Express app
process.env.NODE_ENV = 'test';
process.env.USE_MSW = 'true';
process.env.API_URL = 'https://laa-civil-case-api-uat.cloud-platform.service.justice.gov.uk';
process.env.API_PREFIX = '/latest/mock';

// Now import and start the actual Express application
// The app should be built before running this script
import('../public/app.js')
  .then(() => {
    console.log('🚀 Express application started with MSW enabled');
    console.log('📡 MSW intercepting API calls to:', process.env.API_URL + process.env.API_PREFIX);
    console.log('🎯 Ready for Playwright tests!');
  })
  .catch((error) => {
    console.error('💥 Failed to start Express application:', error);
    console.log('📝 Make sure to run "yarn build" first');
    process.exit(1);
  });

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
  
  mswServer.close();
  console.log('✅ MSW server closed');
  
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
