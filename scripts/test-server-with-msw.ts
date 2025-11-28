/**
 * Test Server with MSW Integration
 * 
 * This script starts the actual Express application with MSW enabled for E2E testing.
 * It initializes MSW to intercept outgoing API calls and serve mock responses.
 */

void (async () => {
  try {
    const { setupServer } = await import('msw/node');
    
    const { handlers } = await import('../tests/playwright/factories/handlers/index.js');

    // Disable rate limiting for E2E tests
    process.env.SKIP_RATE_LIMIT = 'true';

    // Initialize MSW
    const mswServer = setupServer(...handlers);

    // Constants for configuration
    const TEST_PORT = '3001';
    const API_URL = 'https://laa-cla-backend-uat.apps.live-1.cloud-platform.service.justice.gov.uk';
    const API_PREFIX = '/cla_provider/api/v1';
    const SUCCESS_EXIT_CODE = 0;
    const ERROR_EXIT_CODE = 1;

    // Enable request interception
    mswServer.listen({ 
      /**
       * Handles unhandled requests during testing
       * @param {Request} req - The unhandled request
       * @param {object} print - Object containing warning method
       * @param {Function} print.warning - Warning function to call
       */
      onUnhandledRequest: (req: Request, print: { warning: () => void }): void => {
        const warningFn = print.warning.bind(print);
        warningFn();
      }
    });

    // Reset MSW state between tests for isolation
    // Note: This resets handlers, but case state is managed separately
    mswServer.events.on('request:start', () => {
      // Individual test files can reset state using resetMockCaseState if needed
    });

    // Set environment variables
    process.env.NODE_ENV = 'test';
    process.env.PORT = TEST_PORT;
    process.env.USE_MSW = 'true';
    process.env.API_URL = API_URL;
    process.env.API_PREFIX = API_PREFIX;

    // Import and start Express app
    // Path is relative to this script location (scripts/ directory)
    const appModulePath = '../public/app.js';

    import(appModulePath)
      .then(() => {
        console.log('✅ Express application started successfully');
      })
      .catch((error: unknown) => {
        console.error('💥 Failed to start Express application:', error);
        console.log('📝 Make sure to run "yarn build" first');
        process.exit(ERROR_EXIT_CODE);
      });

    /**
     * Gracefully shuts down the server and exits the process
     * @param {string} signal - The signal that triggered the shutdown
     */
    const gracefulShutdown = (signal: string): void => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      mswServer.close();
      process.exit(SUCCESS_EXIT_CODE);
    };

    process.on('SIGTERM', () => { gracefulShutdown('SIGTERM'); });
    process.on('SIGINT', () => { gracefulShutdown('SIGINT'); });

    process.on('uncaughtException', (error: unknown) => {
      console.error('💥 Uncaught Exception:', error);
      process.exit(ERROR_EXIT_CODE);
    });

    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(ERROR_EXIT_CODE);
    });
  } catch (error: unknown) {
    const ERROR_EXIT_CODE = 1;
    const MIN_STACK_LENGTH = 0;
    console.error('💥 ERROR during import:', error);
    if (error instanceof Error && typeof error.stack === 'string' && error.stack.length > MIN_STACK_LENGTH) {
      console.error('Stack:', error.stack);
    }
    process.exit(ERROR_EXIT_CODE);
  }
})();
