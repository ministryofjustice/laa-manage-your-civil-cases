/**
 * API Handlers for MSW
 * 
 * These handlers intercept outgoing HTTP requests that the Express application makes
 * to external APIs and serve mock responses with the correct headers that apiService expects.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { MockCase } from './types.js';
import { createCaseHandlers } from './caseHandlers.js';
import { createPersonalDetailsHandlers } from './personalDetailsHandlers.js';
import { createSupportNeedsHandlers } from './supportNeedsHandlers.js';
import { createThirdPartyHandlers } from './thirdPartyHandlers.js';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load official mock data from laa-civil-case-api
const mockDataPath = join(__dirname, '../../fixtures/mock-data.json');
const mockData = JSON.parse(readFileSync(mockDataPath, 'utf-8'));

// Base API URL that the application calls
const API_BASE_URL = 'https://laa-cla-backend-uat.apps.live-1.cloud-platform.service.justice.gov.uk';
const API_PREFIX = '/cla_provider/api/v1';

// Cast the imported JSON to our known structure
const cases = mockData as MockCase[];

// Create all handlers by calling the factory functions
const caseHandlers = createCaseHandlers(API_BASE_URL, API_PREFIX, cases);
const personalDetailsHandlers = createPersonalDetailsHandlers(API_BASE_URL, API_PREFIX, cases);
const supportNeedsHandlers = createSupportNeedsHandlers(API_BASE_URL, API_PREFIX, cases);
const thirdPartyHandlers = createThirdPartyHandlers(API_BASE_URL, API_PREFIX, cases);

console.log('🔵 [MSW SETUP] Handlers created:', {
  caseHandlers: caseHandlers.length,
  personalDetailsHandlers: personalDetailsHandlers.length,
  supportNeedsHandlers: supportNeedsHandlers.length,
  thirdPartyHandlers: thirdPartyHandlers.length,
  total: caseHandlers.length + personalDetailsHandlers.length + supportNeedsHandlers.length + thirdPartyHandlers.length
});

// Combine all handlers into a single export
export const handlers = [
  ...caseHandlers,
  ...personalDetailsHandlers,
  ...supportNeedsHandlers,
  ...thirdPartyHandlers,
];
