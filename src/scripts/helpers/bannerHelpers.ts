/**
 * Banner Helper Utilities
 *
 * Functions for generating case status banner configurations
 */

import { formatDate } from './dateFormatter.js';
import { t } from './i18nLoader.js';
import type { CaseData } from '../../../types/case-types.js';

/**
 * Banner configuration interface
 */
export interface BannerConfig {
  type: 'warning' | 'information';
  heading: string;
  message: string;
}

/**
 * Generate banner configuration based on case status
 * @param {CaseData} caseData Case data from API
 * @returns {BannerConfig | null} Banner configuration or null if no banner should be shown
 */
export function getCaseStatusBannerConfig(caseData: CaseData): BannerConfig | null {
  const { caseStatus, provider_viewed, provider_closed, outcomeDescription } = caseData;

  // AC4: No banner for New state
  if (caseStatus === 'New') {
    return null;
  }

  // AC5: No banner for Accepted/Advising state
  if (caseStatus === 'Accepted') {
    return null;
  }

  // AC3: Red warning banner for Opened/Pending state
  if (caseStatus === 'Opened' && provider_viewed) {
    const timestamp = formatDate(provider_viewed, true);
    // TODO: Replace placeholder with actual notes field when available
    const reason = 'Awaiting client callback';
    
    return {
      type: 'warning',
      heading: t('pages.caseDetails.banners.pending.heading'),
      message: t('pages.caseDetails.banners.pending.message', { reason, timestamp })
    };
  }

  // AC1 & AC2: Blue info banner for Closed/Completed state
  if (caseStatus === 'Closed' && provider_closed) {
    const timestamp = formatDate(provider_closed, true);
    
    // TODO: Determine Completed vs Closed based on outcome_code when available
    // For now, use outcomeDescription if available, otherwise placeholder
    const isCompleted = false; // TODO: Check outcome_code === 'CLSP'
    
    if (isCompleted) {
      // AC1: Completed banner
      return {
        type: 'information',
        heading: t('pages.caseDetails.banners.completed.heading'),
        message: t('pages.caseDetails.banners.completed.message', { timestamp })
      };
    } else {
      // AC2: Closed banner
      const reason = outcomeDescription || 'Case could not proceed';
      
      return {
        type: 'information',
        heading: t('pages.caseDetails.banners.closed.heading'),
        message: t('pages.caseDetails.banners.closed.message', { reason, timestamp })
      };
    }
  }

  return null;
}
