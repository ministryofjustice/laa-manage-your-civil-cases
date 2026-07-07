import type { Request, Response, NextFunction } from 'express';
import { handleCaseTab } from '#src/scripts/helpers/caseTabHandler.js';
import { apiService } from '#src/services/api/index.js';

/**
 * Handle client details view with API data
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @param {string} activeTab The active tab of the primary navigation
 * @returns {void} Page to be returned
 */
export async function handleFinancialEligibilityTab(req: Request, res: Response, next: NextFunction, activeTab: string): Promise<void> {
  void handleCaseTab(req, res, next, activeTab, 'client details', async ({ req, res, caseReference, activeTab }) => {
    // Client details already fetched by middleware, available at req.clientData
    const { clientData } = req;

    // Set the financial eligibility data
    let financialEligibility;
    if (activeTab === 'financial_eligibility') {
      const response = await apiService.getFinancialEligibility(req.axiosMiddleware, caseReference);
      financialEligibility = response.data;
    } else {
      financialEligibility = null;
    }

    res.render('case_details/index', {
      activeTab,
      client: clientData,
      caseReference,
      financialEligibility,
      sessionID: req.sessionID
    });
  });
}