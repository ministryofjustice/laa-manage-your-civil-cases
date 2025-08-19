// Import all MSW request handlers
import { apiHandlers } from './api.js';

// Export individual handler groups
export { apiHandlers };

// Combine all handlers for the server
export const handlers = [
  ...apiHandlers,
  // Add more handler groups here as needed
];
