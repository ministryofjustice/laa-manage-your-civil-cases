import type { Request, Response, NextFunction } from 'express';
import { apiService } from '#src/services/apiService.js';
import { devLog, createProcessedError, safeString, validCaseReference, formatValidationError, safeBodyString, storeSessionData, t } from '#src/scripts/helpers/index.js';
import { validationResult } from 'express-validator';
import type { ProviderDetail, ProviderSplitChoicesApiResponse, GetAllCategoriesApiResponse, ClientDetailsResponse } from '#types/api-types.js';
import config from '#config.js';

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

interface SelectItem {
  value: string;
  text: string;
  selected: boolean;
}

/**
 * Helper function to build code-name items for select options
 *
 * @template T
 * @param {T[] | null | undefined} items - Array of items to map
 * @param {(key: string) => string} t - Translation function
 * @param {(item: T) => { code: string; name: string }} map - Function to extract code and name
 * @param {{ includeUnknown?: boolean; selectedCode?: string }} [options] - Optional configuration
 * @param {boolean} [options.includeUnknown] - Whether to include an "unknown" choice
 * @param {string} [options.selectedCode] - Code that should be marked as selected
 * @returns {SelectItem[]} Array of select dropdown items
 */
export function buildCodeNameItems<T>(
  items: T[] | null | undefined,
  t: (key: string) => string,
  map: (item: T) => { code: string; name: string },
  options?: { includeUnknown?: boolean; selectedCode?: string }
): SelectItem[] {
  const { includeUnknown = false, selectedCode } = options ?? {};
  const placeholder: SelectItem = {
    value: '',
    text: t('pages.caseDetails.aboutNewCase.categoryPlaceholder'),
    selected: selectedCode === undefined,
  };

  const mapped: SelectItem[] = (items ?? []).map((choice) => {
    const { code, name } = map(choice);
    return {
      value: code,
      text: name,
      selected: selectedCode === code,
    };
  });

  const result: SelectItem[] = [placeholder, ...mapped];

  if (includeUnknown) {
    result.push({
      value: 'none',
      text: `I don't know`,
      selected: selectedCode === 'none'
    });
  }

  return result;
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

    let categoryItems: SelectItem[] = [];

    const currentCategory = (req.clientData as ClientDetailsResponse | undefined)
      ?.scopeTraversal?.category;

    // If internal is false, assign to operator was selected and the full list should be returned. 
    if (req.session.splitCaseCache && typeof req.session.splitCaseCache === 'object' && req.session.splitCaseCache.internal === 'false') {

      const allCategoriesResponse = await apiService.getAllCategories(req.axiosMiddleware);

      if (allCategoriesResponse.status === 'success' && Array.isArray(allCategoriesResponse.data)) {

        categoryItems = buildCodeNameItems(
          allCategoriesResponse.data,
          t,
          (c) => ({ code: c.code, name: c.name }),
          { includeUnknown: true }
        );
      }
    } else {

      categoryItems = buildCodeNameItems(
        provider.law_category,
        t,
        (c) => ({ code: c.code, name: c.name })
      );

    }
    res.render('case_details/about-new-case.njk', {
      caseReference,
      currentCategory,
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
  console.log('Category selected:', category); // Debug log for category value
  const comment = safeBodyString(req.body, 'comment');

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

    let categoryItems: SelectItem[] = [];

    const currentCategory = (req.clientData as ClientDetailsResponse | undefined)
      ?.scopeTraversal?.category;


    // Get the raw value
    const categoryRaw = safeBodyString(req.body, 'category');

    // Narrow it to string | undefined for use in buildCodeNameItems
    const selectedCode: string | undefined =
      typeof categoryRaw === 'string' && categoryRaw.length > 0 ? categoryRaw : undefined;


    // If internal is false, assign to operator was selected and the full list should be returned. 
    if (req.session.splitCaseCache && typeof req.session.splitCaseCache === 'object' && req.session.splitCaseCache.internal === 'false') {

      const allCategoriesResponse = await apiService.getAllCategories(req.axiosMiddleware);

      if (allCategoriesResponse.status === 'success' && Array.isArray(allCategoriesResponse.data)) {

        categoryItems = buildCodeNameItems(
          allCategoriesResponse.data,
          t,
          (c) => ({ code: c.code, name: c.name }),
          { includeUnknown: true, selectedCode }
        );
      }
    } else {

      categoryItems = buildCodeNameItems(
        provider.law_category,
        t,
        (c) => ({ code: c.code, name: c.name }),
        { selectedCode }
      );
    }

    return res.status(BAD_REQUEST).render('case_details/about-new-case.njk', {
      caseReference,
      currentCategory,
      provider,
      categoryItems,
      formData: {
        category,
        comment
      },
      client: req.clientData,
      maxCommentLength: MAX_OPERATOR_FEEDBACK_COMMENT_LENGTH,
      characterThreshold: CHARACTER_THRESHOLD,
      errorState: { hasErrors: true, errors: errorSummaryList, fieldErrors },
      csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined,
    });
  }

  storeSessionData(req, 'aboutNewCaseCache', {
    caseReference,
    category: String(category),
    comment: String(comment),
    cachedAt: String(Date.now())
  });

  return res.redirect(`/cases/${caseReference}/about-new-case`);
}