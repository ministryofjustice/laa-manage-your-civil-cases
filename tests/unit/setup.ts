/**
 * Global test setup for Mocha unit tests
 * Sets up required environment variables before any tests run
 */

// Set required environment variables for tests
process.env.SESSION_SECRET ??= 'test-session-secret-for-mocha-tests-only';
process.env.SESSION_NAME ??= 'test.session';
process.env.SESSION_ENCRYPTION_KEY ??= '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
