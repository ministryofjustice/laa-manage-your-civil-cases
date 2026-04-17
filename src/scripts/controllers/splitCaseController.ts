import type { Request, Response, NextFunction } from 'express';
import { apiService } from '#src/services/apiService.js';
import { devLog, createProcessedError, safeString, validCaseReference, formatValidationError, safeBodyString, storeSessionData, clearSessionData, t, capitaliseFirstLetter } from '#src/scripts/helpers/index.js';
import { validationResult } from 'express-validator';
import type { ProviderDetail, ProviderSplitChoicesApiResponse } from '#types/api-types.js';
import { HTTP } from '#src/services/api/base/constants.js';
import config from '#config.js';
import { ensureSplitCaseCache, hasSplitCaseCache } from '#src/scripts/helpers/sessionHelpers.js';

const { MAX_OPERATOR_FEEDBACK_COMMENT_LENGTH, CHARACTER_THRESHOLD }: { MAX_OPERATOR_FEEDBACK_COMMENT_LENGTH: number; CHARACTER_THRESHOLD: number } = config;


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

  const splitCaseCache = ensureSplitCaseCache(req);
  if (!validCaseReference(caseReference, res)) {
    return;
  }

  try {
    devLog(`Rendering split this case form for case: ${caseReference}`);

    const provider = await fetchProviderNameAndDetail(req, caseReference);

    res.render('case_details/split_case/split-this-case.njk', {
      caseReference,
      provider,
      client: req.clientData,
      splitCaseCache,
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

    return res.status(HTTP.BAD_REQUEST).render('case_details/split-this-case.njk', {
      caseReference,
      client: req.clientData,
      provider,
      errorState: { hasErrors: true, errors: errorSummaryList, fieldErrors },
      csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined,
    });
  }

  const internal = safeBodyString(req.body, 'internal');

  if (!hasSplitCaseCache(req)) {
    // normal journey — save immediately
    storeSessionData(req, 'splitCaseCache', {
      caseReference,
      internal: String(internal)
    });
  } else {
    // do NOT overwrite the original yet — store in a temp key
    req.session.splitCaseCache.internalChange = String(internal);
  }

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
  let category = null;
  let notes = null;

  const splitCaseCache = ensureSplitCaseCache(req);

  const effectiveInternal =
    splitCaseCache.internalChange ?? splitCaseCache.internal;

  if (splitCaseCache.internal === splitCaseCache.internalChange) {
    category = splitCaseCache.category
    notes = splitCaseCache.notes
  }

  if (!validCaseReference(caseReference, res)) {
    return;
  }
  const provider = await fetchProviderNameAndDetail(req, caseReference);
  const operatorSelection = req.session.splitCaseCache && typeof req.session.splitCaseCache === 'object' && effectiveInternal === 'false';
  try {
    devLog(`Rendering about new case form for case: ${caseReference}`);

    let categoryItems: { value: string; text: string; selected: boolean }[] = [];

    if (operatorSelection) {

      const allCategoriesResponse = await apiService.getAllCategories(req.axiosMiddleware);

      if (allCategoriesResponse.status === 'success' && Array.isArray(allCategoriesResponse.data)) {

        categoryItems = [{
          value: '',
          text: t('pages.caseDetails.aboutNewCase.categoryPlaceholder'),
          selected: !category
        },
        ...(await Promise.all(
          allCategoriesResponse.data.map(async choice => ({
            value: choice.code,
            text: capitaliseFirstLetter(
              choice.code === "none" ? t("allCategoriesAdditions.none") : choice.name
            ),
            selected: category === choice.code
          }))
        ))];
      }
    } else {
      categoryItems = [
        {
          value: '',
          text: t('pages.caseDetails.aboutNewCase.categoryPlaceholder'),
          selected: !category
        },
        ...(await Promise.all(
          provider.law_category.map(async choice => ({
            value: choice.code,
            text: capitaliseFirstLetter(choice.name),
            selected: category === choice.code
          }))
        ))];
    }

    res.render('case_details/split_case/about-new-case.njk', {
      caseReference,
      provider,
      categoryItems,
      notes,
      client: req.clientData,
      splitCaseCache,
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

  if (!hasSplitCaseCache(req)) {
    // normal journey — save immediately
    storeSessionData(req, 'splitCaseCache', {
      currentProvider: String(provider.name),
      providerName: String(operatorSelection ? t('pages.caseDetails.splitCase.operatorReassignment') : provider.name),
    });
  } else {
    // do NOT overwrite the original yet — store in a temp key
    req.session.splitCaseCache.providerNameChange = String(operatorSelection ? t('pages.caseDetails.splitCase.operatorReassignment') : provider.name);
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


  const splitCaseCache = ensureSplitCaseCache(req);

  const effectiveInternal =
    splitCaseCache.internalChange ?? splitCaseCache.internal;

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

    const operatorSelection = req.session.splitCaseCache && typeof req.session.splitCaseCache === 'object' && effectiveInternal === 'false';
    // If internal is false, assign to operator was selected and the full list should be returned. 
    if (operatorSelection) {

      const allCategoriesResponse = await apiService.getAllCategories(req.axiosMiddleware);

      if (allCategoriesResponse.status === 'success' && Array.isArray(allCategoriesResponse.data)) {

        categoryItems = [{
          value: '',
          text: t('pages.caseDetails.aboutNewCase.categoryPlaceholder'),
          selected: !category
        },
        ...(await Promise.all(
          allCategoriesResponse.data.map(async choice => ({
            value: choice.code,
            text: capitaliseFirstLetter(
              choice.code === "none" ? t("allCategoriesAdditions.none") : choice.name
            ),
            selected: category === choice.code
          }))
        ))];
      }
    } else {
      categoryItems = [
        {
          value: '',
          text: t('pages.caseDetails.aboutNewCase.categoryPlaceholder'),
          selected: !category
        },
        ...(await Promise.all(
          provider.law_category.map(async choice => ({
            value: choice.code,
            text: capitaliseFirstLetter(choice.name),
            selected: category === choice.code
          }))
        ))];
    }

    return res.status(HTTP.BAD_REQUEST).render('case_details/about-new-case.njk', {
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
    notes: String(notes)
  });

  if (hasSplitCaseCache(req)) {
    if (req.session.splitCaseCache.internalChange) {
      req.session.splitCaseCache.internal =
        req.session.splitCaseCache.internalChange;
    }

    if (req.session.splitCaseCache.providerNameChange) {
      req.session.splitCaseCache.providerName =
        req.session.splitCaseCache.providerNameChange;
    }
  } else {
    req.session.splitCaseCache = {};
  }

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
  const splitCaseCache = ensureSplitCaseCache(req);

  if (hasSplitCaseCache(req)) {
    req.session.splitCaseCache.fromChange = false;
    req.session.splitCaseCache.internalChange = "";
  }


  if (!validCaseReference(caseReference, res)) {
    return;
  }

  try {
    devLog(`Rendering check split case answers form for case: ${caseReference}`);

    res.render('case_details/split_case/check-split-case-answers.njk', {
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
  const splitCaseCache = ensureSplitCaseCache(req);

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

    clearSessionData(req, "splitCaseCache");
    // Redirect to client details page
    res.redirect(`/cases/${caseReference}/client-details`);
  } catch (error) {
    const processedError = createProcessedError(error, `Submitting the "check split case answers" form for case: ${caseReference}`);
    next(processedError);
  }
}

/**
 * Helper function for cache settings when customer wants to change details
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {void} Rendered form pageIf providerId is missing or the API call fails
 */
export async function setSplitCaseCacheSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (hasSplitCaseCache(req)) {
    req.session.splitCaseCache.fromChange = true;
  }
  res.redirect(`/cases/${req.params.caseReference}/split-this-case`);
}