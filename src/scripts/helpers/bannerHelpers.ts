/**
 * Banner Helper Utilities
 *
 * Functions for generating case status banner configurations
 */

import { formatDate } from './dateFormatter.js';
import { t } from './i18nLoader.js';
import type { ClientDetailsResponse } from '../../../types/api-types.js';

/**
 * Banner configuration interface
 */
export interface BannerConfig {
  type: 'warning' | 'information';
  statusLabel: string;
  reason?: string;
  timestamp: string;
}

/**
 * Generate banner configuration based on case status
 * @param {ClientDetailsResponse} caseData Case data from API
 * @returns {BannerConfig | null} Banner configuration or null if no banner should be shown
 */
export function getCaseStatusBannerConfig(caseData: ClientDetailsResponse): BannerConfig | null {
  const { caseStatus, provider_viewed, provider_closed, outcomeCode } = caseData;

  // AC4: No banner for New state
  if (caseStatus === 'New') {
    return null;
  }

  // AC5: No banner for Accepted/Advising state
  if (caseStatus === 'Accepted') {
    return null;
  }

  // AC3: Red warning banner for Opened/Pending state
  if (caseStatus === 'Opened') {
    const timestamp = provider_viewed ? formatDate(provider_viewed, true) : formatDate(new Date().toISOString(), true);
    // Using placeholder text - actual notes field mapping deferred
    const reason = 'Not ready for determination.';
    
    return {
      type: 'warning',
      statusLabel: 'pending',
      reason,
      timestamp
    };
  }

  // AC1 & AC2: Blue info banner for Closed/Completed state
  if (caseStatus === 'Closed') {
    const timestamp = provider_closed ? formatDate(provider_closed, true) : formatDate(new Date().toISOString(), true);
    
    // Determine Completed vs Closed based on outcome_code
    const isCompleted = outcomeCode === 'CLSP';
    
    if (isCompleted) {
      // AC1: Completed banner - timestamp only, no reason
      return {
        type: 'information',
        statusLabel: 'completed',
        timestamp
      };
    } else {
      // AC2: Closed banner - with reason and timestamp
      // Using placeholder text - actual notes field mapping deferred
      const reason = 'This case is not in scope for my category';
      
      return {
        type: 'information',
        statusLabel: 'closed',
        reason,
        timestamp
      };
    }
  }

  return null;
}
