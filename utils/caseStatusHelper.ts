/**
 * Case Status Helper
 * 
 * Utilities for translating API case states to user-facing status labels
 */

/**
 * Translate API case state to user-facing status
 * @param {string} apiState - Case state from API (new, opened, accepted, rejected, closed)
 * @param {string} [outcomeCode] - Outcome code from API (e.g., "CLSP" for completed)
 * @returns {string} User-facing status (new, pending, advising, closed, completed)
 */
export function translateCaseStatus(apiState: string, outcomeCode?: string): string {
  const normalizedState = apiState.toLowerCase();
  
  // Handle closed state - check outcome code to determine if completed
  if (normalizedState === 'closed') {
    return outcomeCode === 'CLSP' ? 'completed' : 'closed';
  }
  
  // Map other states
  const stateMapping: Record<string, string> = {
    new: 'new',
    opened: 'pending',
    accepted: 'advising',
    rejected: 'closed'
  };
  
  return stateMapping[normalizedState] ?? normalizedState;
}
