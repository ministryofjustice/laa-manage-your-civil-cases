/**
 * Banner Helper Utilities
 *
 * Functions for generating case status banner configurations
 */

import { formatDate } from './dateFormatter.js';
import { t } from './i18nLoader.js';
import type { ClientDetailsResponse, LogEntry } from '../../../types/api-types.js';
import { extractOutcomeNotes } from '#src/services/api/transforms/transformLogs.js';

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
 * @param {LogEntry[] | null} logs Optional case event logs for extracting notes
 * @returns {BannerConfig | null} Banner configuration or null if no banner should be shown
 */
export function getCaseStatusBannerConfig(caseData: ClientDetailsResponse, logs: LogEntry[] | null = null): BannerConfig | null {
  const { caseStatus, provider_viewed, provider_closed, outcomeCode, provider_notes } = caseData;

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
    
    // Use provider_notes from case data for Pending reason
    const reason = provider_notes || undefined;
    
    return {
      type: 'warning',
      statusLabel: 'pending',
      ...(reason && { reason }), // Only include reason if it exists
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
      // AC2: Closed banner - with reason from logs if available
      // Rejection/closure outcome codes: MIS-OOS, MIS-MEANS, COI, MIS, DREFER
      const reason = logs ? extractOutcomeNotes(logs, ['MIS-OOS', 'MIS-MEANS', 'COI', 'MIS', 'DREFER']) : undefined;
      
      return {
        type: 'information',
        statusLabel: 'closed',
        ...(reason && { reason }), // Only include reason if it exists
        timestamp
      };
    }
  }

  return null;
}
