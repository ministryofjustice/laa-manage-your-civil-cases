/**
 * API Handlers for MSW
 * 
 * These handlers intercept outgoing HTTP requests that the Express application makes
 * to external APIs and serve mock responses with the correct headers that apiService expects.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MockCase } from './types.js';
import { createCaseHandlers } from './caseHandlers.js';
import { createPersonalDetailsHandlers } from './personalDetailsHandlers.js';
import { createSupportNeedsHandlers } from './supportNeedsHandlers.js';
import { createThirdPartyHandlers } from './thirdPartyHandlers.js';
import { createCaseStatusHandlers } from './caseStatusHandlers.js';
import { createFeedbackHandlers } from './feedbackHandlers.js';
import { createSplitHandlers } from './splitHandlers.js';

// Load official mock data from laa-civil-case-api (relative to project root)
const mockDataPath = join(process.cwd(), 'tests/playwright/fixtures/mock-data.json');
const initialData: MockCase[] = JSON.parse(readFileSync(mockDataPath, 'utf-8'));

// Base API URL that the application calls
const API_BASE_URL = 'https://laa-cla-backend-uat.apps.live-1.cloud-platform.service.justice.gov.uk';
const API_PREFIX = '/cla_provider/api/v1';

// Mutable runtime state
let cases: MockCase[] = structuredClone(initialData);

// Create all handlers by calling the factory functions
const caseHandlers = createCaseHandlers(API_BASE_URL, API_PREFIX, cases);
const personalDetailsHandlers = createPersonalDetailsHandlers(API_BASE_URL, API_PREFIX, cases);
const supportNeedsHandlers = createSupportNeedsHandlers(API_BASE_URL, API_PREFIX, cases);
const thirdPartyHandlers = createThirdPartyHandlers(API_BASE_URL, API_PREFIX, cases);
const caseStatusHandlers = createCaseStatusHandlers(API_BASE_URL, API_PREFIX, cases);
const feedbackHandlers = createFeedbackHandlers(API_BASE_URL, API_PREFIX, cases);
const splitHandlers = createSplitHandlers(API_BASE_URL, API_PREFIX);

// Combine all handlers into a single export
export const handlers = [
  ...caseHandlers,
  ...personalDetailsHandlers,
  ...supportNeedsHandlers,
  ...thirdPartyHandlers,
  ...caseStatusHandlers,
  ...feedbackHandlers,
  ...splitHandlers,
];
