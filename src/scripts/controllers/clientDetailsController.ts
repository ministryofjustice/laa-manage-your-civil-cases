import type { Request, Response, NextFunction } from 'express';
import type { NoChangeWarningCache } from '#src/scripts/helpers/sessionHelpers.js';
import { storeSessionData, clearSessionData, getSessionValue } from '#src/scripts/helpers/sessionHelpers.js';
import { handleCaseTab } from '#src/scripts/helpers/caseTabHandler.js';
import type { ClientSupportNeeds } from '#types/api-types.js';
import { apiService } from '#src/services/api/index.js';

/**
 * Handle client details view with API data
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @param {string} activeTab The active tab of the primary navigation
 * @returns {void} Page to be returned
 */
export async function handleClientDetailsTab(req: Request, res: Response, next: NextFunction, activeTab: string): Promise<void> {
  void handleCaseTab(req, res, next, activeTab, 'client details', async ({ req, res, caseReference, activeTab }) => {
    // Client details already fetched by middleware, available at req.clientData
    const { clientData } = req;

    // Clear splitCaseCache
    clearSessionData(req, "splitCaseCache");

    if (clientData !== null && typeof clientData === 'object' && 'thirdParty' in clientData) {
      // Cache soft-deleted third party state in session to optimize add/remove operations
      // addClientThirdPartyController uses this to decide POST (create) vs PATCH (restore)
      const { thirdParty } = clientData as Record<string, unknown>;
      const hasSoftDeletedThirdParty = typeof thirdParty === 'object' && thirdParty !== null && 'isSoftDeleted' in thirdParty ? Boolean(thirdParty.isSoftDeleted) : false;

      storeSessionData(req, 'thirdPartyCache', {
        caseReference,
        hasSoftDeletedThirdParty: String(hasSoftDeletedThirdParty),
        cachedAt: String(Date.now())
      });
    }

    const noChangeWarningBanner = getSessionValue(req, 'noChangeWarningCache') as NoChangeWarningCache;
    clearSessionData(req, 'noChangeWarningCache');

    const { clientSupportNeeds } = clientData as { clientSupportNeeds?: ClientSupportNeeds; };
    const showClientSupportNeeds = clientSupportNeeds?.bslWebcam === 'Yes' || clientSupportNeeds?.textRelay === 'Yes' || clientSupportNeeds?.callbackPreference === 'Yes' || clientSupportNeeds?.languageSupportNeeds !== '' || clientSupportNeeds?.notes !== '';

    let financialEligibility;
    if (activeTab === 'financial_eligibility') {
      const response = await apiService.getFinancialEligibility(req.axiosMiddleware, caseReference);
      financialEligibility = response.data;
    } else {
      financialEligibility = null;
    }

    res.render('case_details/index.njk', {
      activeTab,
      client: clientData,
      showClientSupportNeeds,
      caseReference,
      financialEligibility,
      sessionID: req.sessionID,
      noChangeWarningBanner
    });
  });
}
