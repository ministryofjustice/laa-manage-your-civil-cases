import type { Request, Response, NextFunction } from 'express';
import { apiService } from '#src/services/apiService.js';
import { devLog, createProcessedError, safeString, validCaseReference, formatValidationError } from '#src/scripts/helpers/index.js';
import { validationResult } from 'express-validator';
import type { ProviderDetail, ProviderSplitChoicesApiResponse } from '#types/api-types.js';

const BAD_REQUEST = 400;

/**
 * Helper function to fetch Provider details
 * @param {Request} req Express request object
 * @param {string} caseReference Case reference number
 * @returns {Promise<ProviderDetail>} Provider details from the API
 * @throws {Error} If providerId is missing or the API call fails
 */
async function fetchProviderNameAndDetail(req: Request, caseReference: string): Promise<ProviderDetail> {
  const { clientData } = req;

  const providerId =
    clientData && typeof clientData === 'object' && 'providerId' in clientData
      ? safeString((clientData).providerId)
      : '';

  if (!providerId) {
    throw createProcessedError(
      new Error('Missing providerId in clientData'),
      `fetching provider details, for case ${caseReference}`
    );
  }

  const providerResponse: ProviderSplitChoicesApiResponse = await apiService.getProviderChoices(req.axiosMiddleware, providerId);

  if (providerResponse.status === 'error' || providerResponse.data === null) {
    throw createProcessedError(
      new Error('Failed to fetch provider name'),
      `fetching provider details, for case ${caseReference}`
    );
  }

  return providerResponse.data;
}

/**
 * Render the "split this case" form
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {void} Rendered form page
 */
export async function getSplitThisCaseForm(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);

    if (!validCaseReference(caseReference, res)) {
    return;
  }

  try {
    devLog(`Rendering split this case form for case: ${caseReference}`);

    const provider = await fetchProviderNameAndDetail(req, caseReference);

    res.render('case_details/split-this-case.njk', {
      caseReference,
      provider,
      client: req.clientData,
      errorState: {
        hasErrors: false,
        errors: [],
        fieldErrors: {}
      },
      csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined
    });
  } catch (error) {
    const processedError = createProcessedError(error, `rendering split this case form, for case ${caseReference}`);
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
    
    // Fetch provider choices for validation error rendering too
    const provider = await fetchProviderNameAndDetail(req, caseReference);

    return res.status(BAD_REQUEST).render('case_details/split-this-case.njk', {
      caseReference,
      client: req.clientData,
      provider,
      errorState: { hasErrors: true, errors: errorSummaryList, fieldErrors },
      csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined,
    });
  }

  return res.redirect(`/cases/${caseReference}/about-new-case`);
}