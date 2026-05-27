import type { Request, Response, NextFunction } from 'express';
import { apiService } from '#src/services/apiService.js';
import { devLog, createProcessedError, safeString, validCaseReference, formatValidationError, safeBodyString, t, capitaliseFirstLetter } from '#src/scripts/helpers/index.js';
import { validationResult } from 'express-validator';
import type { ProviderDetail, ProviderSplitChoicesApiResponse } from '#types/api-types.js';
import { HTTP } from '#src/services/api/base/constants.js';
import config from '#config.js';

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
 * Render the "about new case" form
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {void} Rendered form page
 */
export async function getChangeCategoryOfLaw(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);

  if (!validCaseReference(caseReference, res)) {
    return;
  }

  try {
    devLog(`Rendering change category form for case: ${caseReference}`);

    const provider = await fetchProviderNameAndDetail(req, caseReference);

    let categoryItems: { value: string; text: string; selected: boolean }[] = [];

    const currentCategoryName = (req.clientData as { category?: string })?.category;

    const currentCategoryCode = provider.law_category.find(
      c => c.name === currentCategoryName
    )?.code;

    console.log('Current category from clientData:', currentCategoryCode);

    categoryItems = [
      {
        value: '',
        text: t('pages.caseDetails.aboutNewCase.categoryPlaceholder'),
        selected: true
      },
      ...(await Promise.all(
        provider.law_category.filter(choice => choice.code !== currentCategoryCode)
          .map(async choice => ({
            value: choice.code,
            text: capitaliseFirstLetter(choice.name),
            selected: false
          }))
      ))];

    res.render('case_details/change-category-of-law.njk', {
      caseReference,
      provider,
      categoryItems,
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
 * Handle "about new case" form submission
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {Promise<void>} Redirect to client details page
 */
export async function submitChangeCategoryOfLawForm(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);

  const category = safeBodyString(req.body, 'category') as string;
  const notes = safeBodyString(req.body, 'notes') as string;

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

    const currentCategoryName = (req.clientData as { category?: string })?.category;

    const currentCategoryCode = provider.law_category.find(
      c => c.name === currentCategoryName
    )?.code;

    console.log('Current category from clientData:', currentCategoryCode);

    categoryItems = [
      {
        value: '',
        text: t('pages.caseDetails.aboutNewCase.categoryPlaceholder'),
        selected: true
      },
      ...(await Promise.all(
        provider.law_category.filter(choice => choice.code !== currentCategoryCode)
          .map(async choice => ({
            value: choice.code,
            text: capitaliseFirstLetter(choice.name),
            selected: false
          }))
      ))];

    return res.status(HTTP.BAD_REQUEST).render('case_details/change-category-of-law.njk', {
      caseReference,
      provider,
      categoryItems,
      client: req.clientData,
      formData: {
        category,
        notes
      },
      maxCommentLength: MAX_OPERATOR_FEEDBACK_COMMENT_LENGTH,
      characterThreshold: CHARACTER_THRESHOLD,
      errorState: { hasErrors: true, errors: errorSummaryList, fieldErrors },
      csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined,
    });
  }

  try {
    const response = await apiService.changeCaseCategory(
      req.axiosMiddleware,
      caseReference,
      category,
      notes
    );

    if (response.status === 'error') {
      throw new Error(response.message || 'Failed to change category');
    }

    devLog(`Category successfully changed for case ${caseReference}`);

    return res.redirect(`/cases/${caseReference}/case-details`);

  } catch (error) {
    const processedError = createProcessedError(
      error,
      `changing category for case ${caseReference}`
    );

    return next(processedError);
  }
}
