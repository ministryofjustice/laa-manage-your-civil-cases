import type { Request, Response, NextFunction } from 'express';
import { apiService } from '#src/services/apiService.js';
import { devLog, createProcessedError, safeString, validCaseReference, formatValidationError, safeBodyString, storeSessionData, t } from '#src/scripts/helpers/index.js';
import { validationResult } from 'express-validator';
import type { ProviderDetail, ProviderSplitChoicesApiResponse } from '#types/api-types.js';
import config from '#config.js';
import { validateAboutNewCase } from '#src/middlewares/aboutNewCaseSchema.js';

const { MAX_OPERATOR_FEEDBACK_COMMENT_LENGTH, CHARACTER_THRESHOLD }: { MAX_OPERATOR_FEEDBACK_COMMENT_LENGTH: number; CHARACTER_THRESHOLD: number } = config;
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

  const internal = safeBodyString(req.body, 'internal');

  storeSessionData(req, 'splitCaseCache', {
    caseReference,
    internal: String(internal),
    cachedAt: String(Date.now())
  });

  return res.redirect(`/cases/${caseReference}/about-new-case`);
}

/**
 * Render the "about new case" form
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

    const provider = await fetchProviderNameAndDetail(req, caseReference);

    let categoryItems: { value: string; text: string; selected: boolean }[] = [];

    if (req.session.splitCaseCache && typeof req.session.splitCaseCache === 'object' && req.session.splitCaseCache.internal === 'false') {

      const allCategoriesResponse = await apiService.getAllCategories(req.axiosMiddleware);

      if (allCategoriesResponse.status === 'success' && Array.isArray(allCategoriesResponse.data)) {
        categoryItems = [{
          value: '',
          text: t('pages.caseDetails.aboutNewCase.categoryPlaceholder'),
          selected: true
        },
        ...allCategoriesResponse.data.map(choice => ({
          value: choice.code,
          text: choice.code === 'none' ? t('allCategoriesAdditions.none') : choice.name,
          selected: false
        }))
        ];
      }
    } else {
      categoryItems = [
        {
          value: '',
          text: t('pages.caseDetails.aboutNewCase.categoryPlaceholder'),
          selected: true
        },
        ...provider.law_category.map(choice => ({
          value: choice.code,
          text: choice.name,
          selected: false
        }))
      ];
    }

    res.render('case_details/about-new-case.njk', {
      caseReference,
      provider,
      categoryItems,
      client: req.clientData,
      errorState: {
        hasErrors: false,
        errors: [],
        fieldErrors: {}
      },
      maxCommentLength: MAX_OPERATOR_FEEDBACK_COMMENT_LENGTH,
      characterThreshold: CHARACTER_THRESHOLD,
      csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined
    });
  } catch (error) {
    const processedError = createProcessedError(error, `rendering about new case form, for case ${caseReference}`);
    next(processedError);
  }
}

/**
 * Handle "about new case" form submission
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {Promise<void>} Redirect to client details page
 */
export async function submitAboutNewCaseForm(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);
  const category = safeBodyString(req.body, 'category');
  const notes = safeBodyString(req.body, 'notes');

   console.log("category of law selected: " + category);
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

    const provider = await fetchProviderNameAndDetail(req, caseReference);

    let categoryItems: { value: string; text: string; selected: boolean }[] = [];

    // If internal is false, assign to operator was selected and the full list should be returned. 
    if (req.session.splitCaseCache && typeof req.session.splitCaseCache === 'object' && req.session.splitCaseCache.internal === 'false') {

      const allCategoriesResponse = await apiService.getAllCategories(req.axiosMiddleware);

      if (allCategoriesResponse.status === 'success' && Array.isArray(allCategoriesResponse.data)) {
        categoryItems = [{
          value: '',
          text: t('pages.caseDetails.aboutNewCase.categoryPlaceholder'),
          selected: !category
        },
        ...allCategoriesResponse.data.map(choice => {
            // Replace "None of the above"
            if (choice.name === 'None of the above') {
              return {
                value: 'none',
                text: t('common.categoryCode.none'),
                selected: category === 'none'
              };
            }
            return {
              value: choice.code,
              text: choice.name,
              selected: category === choice.code
            };
          })
        ];
      }
    } else {
      categoryItems = [
        {
          value: '',
          text: t('pages.caseDetails.aboutNewCase.categoryPlaceholder'),
          selected: !category
        },
        ...provider.law_category.map(choice => ({
          value: choice.code,
          text: choice.name,
          selected: category === choice.code
        }))
      ];
    }

    return res.status(BAD_REQUEST).render('case_details/about-new-case.njk', {
      caseReference,
      provider,
      categoryItems,
      formData: {
        category,
        notes
      },
      client: req.clientData,
      maxCommentLength: MAX_OPERATOR_FEEDBACK_COMMENT_LENGTH,
      characterThreshold: CHARACTER_THRESHOLD,
      errorState: { hasErrors: true, errors: errorSummaryList, fieldErrors },
      csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined,
    });
  }

  storeSessionData(req, 'splitCaseCache', {
    category: String(category),
    notes: String(notes),
    cachedAt: String(Date.now())
  });

  return res.redirect(`/cases/${caseReference}/check-split-case-answers`);
}

/**
 * Render the "check split case answers" form
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {void} Rendered form page
 */
export async function getCheckSplitCaseAnswersForm(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);
  const splitCaseCache = req.session.splitCaseCache;

  if (!validCaseReference(caseReference, res)) {
    return;
  }

  try {
    devLog(`Rendering check split case answers form for case: ${caseReference}`);

    res.render('case_details/check-split-case-answers.njk', {
      caseReference,
      splitCaseCache,
      client: req.clientData,
      errorState: {
        hasErrors: false,
        errors: [],
        fieldErrors: {}
      },
      csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined
    });
  } catch (error) {
    const processedError = createProcessedError(error, `Rendering check split case answers form, for case ${caseReference}`);
    next(processedError);
  }
}

/**
 * Handle "check split case answers" form submission
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {Promise<void>} Redirect to client details page
 */
export async function submitCheckSplitCaseAnswersForm(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);
  const splitCaseCache = req.session.splitCaseCache;

  if (!validCaseReference(caseReference, res)) {
    return;
  }

  try {
    devLog(`Submitting the "check split case answers" form for case: ${caseReference}`);

    const category = splitCaseCache && typeof splitCaseCache.category === 'string' ? splitCaseCache.category.trim() : '';
    const notes = splitCaseCache && typeof splitCaseCache.notes === 'string' ? splitCaseCache.notes.trim() : '';
    const internal = splitCaseCache?.internal === 'true';

    if (!category || !notes) {
      const processedError = createProcessedError(
        new Error('Split case session data is missing required values'),
        `Submitting "check split case answers" form, for case ${caseReference}`
      );
      return next(processedError);
    }

    devLog(`Category: ${category}, Internal:${internal}, Notes: ${notes}`);

    // Submit operator feedback to API
    const response = await apiService.submitSplitCase(
      req.axiosMiddleware,
      caseReference,
      {
        category,
        internal,
        notes
      }
    );

    if (response.status === 'error') {
      const processedError = createProcessedError(
        new Error(response.message || 'Failed to submit "check split case answers" form'),
        `Submitting "check split case answers" form, for case ${caseReference}`
      );
      return next(processedError);
    }

    devLog(`"check split case answers" form, submitted successfully for case: ${caseReference}`);

    // Redirect to client details page
    res.redirect(`/cases/${caseReference}/client-details`);
  } catch (error) {
    const processedError = createProcessedError(error, `Submitting the "check split case answers" form for case: ${caseReference}`);
    next(processedError);
  }
}