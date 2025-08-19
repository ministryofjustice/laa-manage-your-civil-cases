import { setupServer } from 'msw/node';
import { handlers } from './handlers/index.js';

// Create the MSW server with our handlers
export const server = setupServer(...handlers);
