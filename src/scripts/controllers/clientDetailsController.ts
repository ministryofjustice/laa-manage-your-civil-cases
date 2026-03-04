import type { Request, Response, NextFunction } from 'express';
import { storeSessionData } from '#src/scripts/helpers/sessionHelpers.js';
import { handleCaseTab } from '#src/scripts/helpers/caseTabHandler.js';

/**
 * Handle client details view with API data
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @param {string} activeTab The active tab of the primary navigation
 * @returns {void} Page to be returned
 */
export function handleClientDetailsTab(req: Request, res: Response, next: NextFunction, activeTab: string): void {
  void handleCaseTab(req, res, next, activeTab, 'client details', ({ req, res, caseReference, activeTab }) => {
    // Client details already fetched by middleware, available at req.clientData
    const { clientData } = req;

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

    res.render('case_details/index.njk', {
      activeTab,
      client: clientData,
      caseReference
    });
  });
}
