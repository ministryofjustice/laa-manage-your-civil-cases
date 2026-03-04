import type { Request, Response, NextFunction } from 'express';
import { clearAllOriginalFormData, createProcessedError, devLog, safeString, validCaseReference } from './index.js';

interface CaseTabHandlerContext {
  req: Request;
  res: Response;
  next: NextFunction;
  caseReference: string;
  activeTab: string;
}

type CaseTabHandler = (context: CaseTabHandlerContext) => Promise<void> | void;

/**
 * Handle common case tab functionality and execute tab-specific logic
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @param {string} activeTab The active tab of the primary navigation
 * @param {string} logContext Context to be included in log and error messages
 * @param {CaseTabHandler} handler Tab-specific behaviour callable
 * @returns {Promise<void>} Resolves when tab handling is complete
 */
export async function handleCaseTab(req: Request, res: Response, next: NextFunction, activeTab: string, logContext: string, handler: CaseTabHandler): Promise<void> {
  const caseReference = safeString(req.params.caseReference);

  if (!validCaseReference(caseReference, res)) {
    return;
  }

  clearAllOriginalFormData(req);

  try {
    devLog(`Fetching ${logContext} for case: ${caseReference}, tab: ${activeTab}`);
    await handler({ req, res, next, caseReference, activeTab });
  } catch (error) {
    const processedError = createProcessedError(error, `fetching ${logContext} for case ${caseReference}`);
    next(processedError);
  }
}