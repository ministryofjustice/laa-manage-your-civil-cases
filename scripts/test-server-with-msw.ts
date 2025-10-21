/**
 * Test Server with MSW Integration
 * 
 * This script starts the actual Express application with MSW enabled for E2E testing.
 * It initializes MSW to intercept outgoing API calls and serve mock responses.
 */

import { setupServer } from 'msw/node';
import { handlers } from '../tests/playwright/factories/handlers/index.js';

// Disable rate limiting for E2E tests to prevent 429 errors during parallel test execution
process.env.SKIP_RATE_LIMIT = 'true';

// Initialize MSW before importing the app
const mswServer = setupServer(...handlers);

// Constants for configuration
const TEST_PORT = '3001';
const API_URL = 'https://laa-cla-backend-uat.apps.live-1.cloud-platform.service.justice.gov.uk';
const API_PREFIX = '/cla_provider/api/v1';
const MSW_TEST_DELAY = 1000;
const SUCCESS_EXIT_CODE = 0;
const ERROR_EXIT_CODE = 1;

// Enable request interception with simple warning for unhandled requests
mswServer.listen({ 
  /**
   * Handler for unhandled requests to provide warning feedback
   * @param {Request} req - The unhandled request
   * @param {object} print - Logging utilities with warning method
   * @param {Function} print.warning - Warning logging function
   * @returns {void}
   */
  onUnhandledRequest: (req: Request, print: { warning: () => void }): void => {
    print.warning();
  }
});

// Set environment variables for the Express app
process.env.NODE_ENV = 'test';
process.env.PORT = TEST_PORT;  // Ensure server runs on port 3001 for Playwright
process.env.USE_MSW = 'true';
process.env.API_URL = API_URL;
process.env.API_PREFIX = API_PREFIX;

// Now import and start the actual Express application
// The app should be built before running this script
// Use dynamic import with proper error handling for CI/CD environments
const appModulePath = '../public/app.js';

import(appModulePath)
  .then(() => {
    console.log('✅ Express application started successfully');
    // Test MSW is working by making a test request
    setTimeout((): void => {
      void (async (): Promise<void> => {
        try {
          await fetch(`${API_URL}${API_PREFIX}/test`);
        } catch (error: unknown) {
          // Expected to fail - this is just testing MSW is intercepting
        }
      })();
    }, MSW_TEST_DELAY);
  })
  .catch((error: unknown) => {
    console.error('💥 Failed to start Express application:', error);
    console.log('📝 Make sure to run "yarn build" first');
    console.log('📝 Expected file location: public/app.js');
    process.exit(ERROR_EXIT_CODE);
  });

// Graceful shutdown
/**
 * Handles graceful shutdown of the server when receiving termination signals
 * @param {string} signal - The termination signal received (SIGTERM, SIGINT, etc.)
 * @returns {void}
 */
const gracefulShutdown = (signal: string): void => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
  
  mswServer.close();
  
  process.exit(SUCCESS_EXIT_CODE);
};

process.on('SIGTERM', () => { gracefulShutdown('SIGTERM'); });
process.on('SIGINT', () => { gracefulShutdown('SIGINT'); });

// Handle uncaught exceptions
process.on('uncaughtException', (error: unknown) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(ERROR_EXIT_CODE);
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(ERROR_EXIT_CODE);
});
