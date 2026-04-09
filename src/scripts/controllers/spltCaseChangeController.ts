import type { Request, Response, NextFunction } from 'express';

/**
 * Helper function for cache settings when customer wants to change details
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {void} Rendered form pageIf providerId is missing or the API call fails
 */
export async function setSplitCaseCacheSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  req.session.splitCaseCache = req.session.splitCaseCache || {};
  req.session.splitCaseCache.fromChange = true;

  res.redirect(`/cases/${req.params.caseReference}/split-this-case`);
}

