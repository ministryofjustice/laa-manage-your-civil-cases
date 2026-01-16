/**
 * Central configuration for test URLs
 * Provides consistent URLs for different case statuses and pages
 */

type CaseStatus = 'new' | 'open' | 'accepted' | 'closed' | 'default';

interface TestCase {
  reference: string;
  status: CaseStatus;
}

/**
 * Test case data with different statuses
 * These reference existing cases in tests/playwright/fixtures/mock-data.json
 */
const TEST_CASES: Record<string, TestCase> = {
  DEFAULT_CASE: {
    reference: 'PC-1922-1879',
    status: 'default'
  },
  NEW_CASE: {
    reference: 'PC-1922-1879',
    status: 'new'
  },
  OPEN_CASE: {
    reference: 'PC-1869-9154',
    status: 'open'
  },
  ACCEPTED_CASE: {
    reference: 'PC-3184-5962', // Ember Hamilton - Accepted status
    status: 'accepted'
  },
  CLOSED_CASE: {
    reference: 'PC-6667-9089', // Roronoa Zoro - Closed status
    status: 'closed'
  }
} as const;


/**
 * Generate URL for case client details page
 * @param {string} caseReference - The case reference number
 * @returns {string} The client details URL
 */
function getClientDetailsUrl(caseReference: string): string {
  return `/cases/${caseReference}/client-details`;
}


/**
 * Get client details URL for a specific case status
 * @param {'open' | 'accepted' | 'closed'} status - The case status
 * @returns {string} The client details URL for that status
 */
export function getClientDetailsUrlByStatus(status: CaseStatus): string {
  const testCase = Object.values(TEST_CASES).find(c => c.status === status);
  if (testCase === undefined) {
    throw new Error(`No test case found for status: ${status}`);
  }
  return getClientDetailsUrl(testCase.reference);
}