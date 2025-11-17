/**
 * Test Server with MSW Integration
 * 
 * This script starts the actual Express application with MSW enabled for E2E testing.
 * It initializes MSW to intercept outgoing API calls and serve mock responses.
 */

//Polyfill localStorage BEFORE any MSW-related imports - node 25/msw compatibility 
const hasValidLocalStorage = 
  'localStorage' in globalThis &&
  typeof (globalThis.localStorage).getItem === 'function';

if (!hasValidLocalStorage) {
  const storage = new Map<string, string>();
  
  const localStoragePolyfill = {
    /**
     * Retrieves an item from storage
     * @param {string} key - The storage key
     * @returns {string | null} The stored value or null if not found
     */
    getItem(key: string): string | null {
      const result = storage.get(key) ?? null;
      return result;
    },
    /**
     * Stores an item in storage
     * @param {string} key - The storage key
     * @param {string} value - The value to store
     */
    setItem(key: string, value: string): void {
      storage.set(key, value);
    },
    /**
     * Removes an item from storage
     * @param {string} key - The storage key to remove
     */
    removeItem(key: string): void {
      storage.delete(key);
    },
    /**
     * Clears all items from storage
     */
    clear(): void {
      storage.clear();
    },
    /**
     * Retrieves the key at the specified index
     * @param {number} index - The index position
     * @returns {string | null} The key at the index or null if not found
     */
    key(index: number): string | null {
      return Array.from(storage.keys())[index] ?? null;
    },
    /**
     * Gets the number of items in storage
     * @returns {number} The count of stored items
     */
    get length(): number {
      return storage.size;
    }
  };
  
  (globalThis as typeof globalThis & { localStorage: Storage }).localStorage = localStoragePolyfill as Storage;
}

// Use dynamic imports to ensure polyfill is set up before MSW loads
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

    // Set environment variables
    process.env.NODE_ENV = 'test';
    process.env.PORT = TEST_PORT;
    process.env.USE_MSW = 'true';
    process.env.API_URL = API_URL;
    process.env.API_PREFIX = API_PREFIX;

    // Import and start Express app (compiled to public/scripts/, app is in public/)
    const appModulePath = '../app.js';

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
