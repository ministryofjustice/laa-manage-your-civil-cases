/**
 * API Service
 *
 * This file maintains backward compatibility by re-exporting from the modular API services.
 * The original implementation has been split into domain-specific services for better organization.
 * 
 * @deprecated Import from '#src/services/api/index.js' instead for new code
 */

// Re-export everything from the modular API services
export * from './api/index.js';

// Re-export the combined apiService object as the default export
export { apiService } from './api/index.js';
