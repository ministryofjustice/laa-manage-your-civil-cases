import type { Request, Response, NextFunction } from 'express';
import { apiService } from '#src/services/apiService.js';
import { devLog, createProcessedError, safeString, validCaseReference, formatValidationError, safeBodyString, storeSessionData } from '#src/scripts/helpers/index.js';
import { validationResult } from 'express-validator';

const BAD_REQUEST = 400;

/**
 * Render the "split this case" form
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {void} Rendered form page
 */
export async function getAboutNewCaseForm(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);

  if (!validCaseReference(caseReference, res)) {
    return;
  }

  try {
    devLog(`Rendering about new case form for case: ${caseReference}`);

    
    // Make call to get provider case of law 
    // use provider detail in src/types/api-types to get provider details and category of law. 
    // add this to rendering 


    res.render('case_details/about-new-case.njk', {
      caseReference,
      client: req.clientData,
      errorState: {
        hasErrors: false,
        errors: [],
        fieldErrors: {}
      },
      csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined
    });
  } catch (error) {
    const processedError = createProcessedError(error, `rendering about new case form, for case ${caseReference}`);
    next(processedError);
  }
}


/**
 * Handle "split this case" form submission
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {Promise<void>} Redirect to client details page
 */
export async function submitSplitThisCaseForm(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);

  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const rawErrors = errors.array({ onlyFirstError: false });

    const validationErrors = rawErrors.map((error) => {
      const field = 'path' in error && typeof error.path === 'string' ? error.path : '';
      const { inlineMessage = '', summaryMessage } = formatValidationError(error);
      return { field, inlineMessage, summaryMessage };
    });

    const fieldErrors = validationErrors.reduce<Record<string, { text: string }>>((acc, { field, inlineMessage }) => {
      acc[field] = { text: inlineMessage.trim() };
      return acc;
    }, {});

    // Build the GOV.UK error summary list
    const errorSummaryList = validationErrors.map(({ field, summaryMessage }) => ({
      text: summaryMessage,
      href: `#${field}`
    }));
    

    return res.status(BAD_REQUEST).render('case_details/about-new-case.njk', {
      caseReference,
      client: req.clientData,
      errorState: { hasErrors: true, errors: errorSummaryList, fieldErrors },
      csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined,
    });
  }

  const internal = safeBodyString(req.body, 'internal');

  storeSessionData(req, 'splitCaseCache', {
    caseReference,
    internal: String(internal),
    cachedAt: String(Date.now())
  });

  return res.redirect(`/cases/${caseReference}/about-new-case`);
}