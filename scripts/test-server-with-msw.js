/**
 * Test Server with MSW Integration
 * 
 * This script starts the actual Express application with MSW enabled for E2E testing.
 * It initializes MSW to intercept outgoing API calls and serve mock responses.
 */

import { setupServer } from 'msw/node';
import { handlers } from '../tests/e2e/mocks/handlers/index.js';

// Disable rate limiting for E2E tests to prevent 429 errors during parallel test execution
process.env.SKIP_RATE_LIMIT = 'true';

// Force all output to be visible
process.stdout.write('🎭 [' + new Date().toISOString() + '] Starting Express app with MSW integration...\n');

// Initialize MSW before importing the app
const mswServer = setupServer(...handlers);

// Enable request interception with enhanced debugging
mswServer.listen({ 
  onUnhandledRequest: (req, print) => {
    const timestamp = new Date().toISOString();
    process.stdout.write(`🚨 [${timestamp}] UNHANDLED REQUEST: ${req.method} ${req.url}\n`);
    process.stdout.write(`🚨 [${timestamp}] Headers: ${JSON.stringify(req.headers.raw())}\n`);
    process.stdout.write(`🚨 [${timestamp}] Origin: ${req.headers.get('origin')}\n`);
    process.stdout.write(`🚨 [${timestamp}] User-Agent: ${req.headers.get('user-agent')}\n`);
    print.warning();
  }
});

process.stdout.write('✅ [' + new Date().toISOString() + '] MSW server initialized with ' + handlers.length + ' handlers\n');
process.stdout.write('🔍 [' + new Date().toISOString() + '] MSW handlers loaded:\n');
handlers.forEach((handler, index) => {
  process.stdout.write(`  ${index + 1}. ${handler.info.method} ${handler.info.path}\n`);
});

// Set environment variables for the Express app
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';  // Ensure server runs on port 3001 for Playwright
process.env.USE_MSW = 'true';
process.env.API_URL = 'https://laa-civil-case-api-uat.cloud-platform.service.justice.gov.uk';
process.env.API_PREFIX = '/latest/mock';

// Now import and start the actual Express application
// The app should be built before running this script
import('../public/app.js')
  .then(() => {
    const timestamp = new Date().toISOString();
    process.stdout.write(`🚀 [${timestamp}] Express application started with MSW enabled\n`);
    process.stdout.write(`📡 [${timestamp}] MSW intercepting API calls to: ${process.env.API_URL}${process.env.API_PREFIX}\n`);
    process.stdout.write(`🎯 [${timestamp}] Ready for Playwright tests!\n`);
    
    // Test MSW is working by making a test request
    setTimeout(async () => {
      try {
        const response = await fetch(process.env.API_URL + process.env.API_PREFIX + '/test');
        console.log('🧪 MSW Test Response Status:', response.status);
      } catch (error) {
        console.log('🧪 MSW Test Request Failed (Expected):', error.message);
      }
    }, 1000);
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
