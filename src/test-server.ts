/**
 * Test Server with MSW Integration
 * 
 * This server is used during Playwright E2E tests to intercept API calls
 * using Mock Service Worker (MSW) and serve mock responses from local fixtures.
 * 
 * Based on the MSW + Playwright spike implementation.
 */

import { setupServer } from 'msw/node';
import { handlers } from '../tests/e2e/mocks/handlers/index.js';
import createApp from './app.js';

console.log('🎭 Starting test server with MSW integration...');

// Initialize MSW before Express startup
const mswServer = setupServer(...handlers);

// Configure MSW server (simplified for MSW v2 compatibility)
mswServer.listen({ 
  onUnhandledRequest: 'warn'
});

console.log('✅ MSW server initialized with', handlers.length, 'handlers');

// Log environment configuration for debugging
console.log('🔍 Environment Configuration:');
console.log('  - NODE_ENV:', process.env.NODE_ENV);
console.log('  - PORT:', process.env.PORT);
console.log('  - API_URL:', process.env.API_URL);
console.log('  - API_PREFIX:', process.env.API_PREFIX);
console.log('  - USE_MOCK_API:', process.env.USE_MOCK_API);

// Start Express with MSW active
const app = createApp();
const port = process.env.PORT || 3001;

const server = app.listen(port, () => {
  console.log(`🚀 Express test server listening on port ${port}`);
  console.log(`📡 MSW intercepting API calls to: ${process.env.API_URL || 'http://localhost:3001'}${process.env.API_PREFIX || '/latest/mock'}`);
  console.log('🎯 Ready for Playwright tests!');
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
  
  server.close(() => {
    console.log('✅ Express server closed');
    
    mswServer.close();
    console.log('✅ MSW server closed');
    
    process.exit(0);
  });
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
