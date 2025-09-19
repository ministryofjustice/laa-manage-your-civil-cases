/**
 * Test Server with MSW Integration
 * 
 * This server is used during Playwright E2E tests to intercept API calls
 * using Mock Service Worker (MSW) and serve mock responses from local fixtures.
 * 
 * Creates a minimal Express server with MSW, avoiding complex dependencies.
 */

import express from 'express';
import { setupServer } from 'msw/node';
import { handlers } from '../tests/e2e/mocks/handlers/index.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Initialize MSW before Express startup
const mswServer = setupServer(...handlers);

// Configure MSW server (simplified for MSW v2 compatibility)
mswServer.listen({ 
  onUnhandledRequest: 'warn'
});


// Create minimal Express app for testing
const app = express();

// Basic middleware for serving static files and parsing requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets
app.use('/assets', express.static(path.join(__dirname, '../../public/assets')));
app.use('/css', express.static(path.join(__dirname, '../../public/css')));
app.use('/js', express.static(path.join(__dirname, '../../public/js')));

// Basic route for health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', msw: 'enabled' });
});

// Simple test page route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>MSW Test Server</title>
        <meta charset="utf-8">
      </head>
      <body>
        <h1>Manage your civil cases</h1>
        <p>MSW Test Server is running</p>
        <p>MSW handlers: ${handlers.length}</p>
      </body>
    </html>
  `);
});

// Log environment configuration for debugging
console.log('  - NODE_ENV:', process.env.NODE_ENV);
console.log('  - PORT:', process.env.PORT);
console.log('  - API_URL:', process.env.API_URL);
console.log('  - API_PREFIX:', process.env.API_PREFIX);
console.log('  - USE_MSW:', process.env.USE_MSW);

// Start Express with MSW active
const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`🚀 Express test server listening on port ${port}`);
});

// Graceful shutdown
/**
 * Handles graceful shutdown of the server when receiving termination signals
 * @param {string} signal - The termination signal received (SIGTERM, SIGINT, etc.)
 * @returns {void}
 */
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
  
  server.close(() => {
    console.log('✅ Express server closed');
    
    mswServer.close();
    
    process.exit(0);
  });
};

process.on('SIGTERM', () => { gracefulShutdown('SIGTERM'); });
process.on('SIGINT', () => { gracefulShutdown('SIGINT'); });

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
