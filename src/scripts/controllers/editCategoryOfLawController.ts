import type { Request, Response, NextFunction } from 'express';
import { apiService } from '#src/services/apiService.js';
import { devLog, createProcessedError, safeString, validCaseReference, formatValidationError, safeBodyString, t, fetchProviderNameAndDetail, getSessionString } from '#src/scripts/helpers/index.js';
import { validationResult } from 'express-validator';
import { HTTP } from '#src/services/api/base/constants.js';
import config from '#config.js';
import { buildCategoryItems } from '../helpers/dataTransformers.js';

const { MAX_OPERATOR_FEEDBACK_COMMENT_LENGTH, CHARACTER_THRESHOLD }: { MAX_OPERATOR_FEEDBACK_COMMENT_LENGTH: number; CHARACTER_THRESHOLD: number } = config;

/**
 * Render the "change category of law" form
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

    // Get the current category name and use this to get the code of the current category to remove from the list
    const currentCategoryName = (req.clientData as { category?: string })?.category;
    const currentCategoryCode = provider.law_category.find(
      c => c.name === currentCategoryName
    )?.code;

    // Build the category items list
    categoryItems = await buildCategoryItems({
      choices: provider.law_category,
      selectedCategory: undefined,
      placeholderText: t('pages.caseDetails.changeCategoryOfLaw.categoryPlaceholder'),
      excludeCode: currentCategoryCode
    });

    if (categoryItems.length <= 1) { 
      return res.redirect(`/cases/${caseReference}/client-details`);
    }

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
    const processedError = createProcessedError(error, `rendering change category form, for case ${caseReference}`);
    next(processedError);
  }
}

/**
 * Handle "change category of law" form submission
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

    const currentCategoryCode = provider.law_category.find(c => c.name === currentCategoryName)?.code;

    categoryItems = await buildCategoryItems({
      choices: provider.law_category,
      selectedCategory: undefined,
      placeholderText: t('pages.caseDetails.changeCategoryOfLaw.categoryPlaceholder'),
      excludeCode: currentCategoryCode
    });

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
    const response = await apiService.changeCaseCategory(req.axiosMiddleware, caseReference, category, notes);

    if (response.status === 'error') {
      throw new Error(response.message || 'Failed to change category');
    }

    devLog(`Category successfully changed for case ${caseReference}`);

    return res.redirect(`/cases/${caseReference}/case-details`);

  } catch (error) {
    const processedError = createProcessedError(error, `changing category for case ${caseReference}`);

    return next(processedError);
  }
}