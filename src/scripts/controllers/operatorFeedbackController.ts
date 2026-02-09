import type { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { apiService } from '#src/services/apiService.js';
import { devLog, createProcessedError, safeString, safeBodyString, formatValidationError, validCaseReference, t, hasAllowedCaseStatus } from '#src/scripts/helpers/index.js';
import config from '#config.js';

const { MAX_OPERATOR_FEEDBACK_COMMENT_LENGTH, CHARACTER_THRESHOLD }: { MAX_OPERATOR_FEEDBACK_COMMENT_LENGTH: number; CHARACTER_THRESHOLD: number } = config;
const BAD_REQUEST = 400;

/**
 * Render the operator feedback form
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {void} Rendered form page
 */
export async function getOperatorFeedbackForm(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);

  if (!validCaseReference(caseReference, res)) {
    return;
  }

  try {
    devLog(`Rendering operator feedback form for case: ${caseReference}`);

    // Fetch feedback choices from API
    const feedbackChoicesResponse = await apiService.getFeedbackChoices(req.axiosMiddleware, caseReference);

    if (feedbackChoicesResponse.status === 'error' || feedbackChoicesResponse.data === null) {
      const processedError = createProcessedError(
        new Error('Failed to fetch feedback choices'),
        `rendering operator feedback form for case ${caseReference}`
      );
      return next(processedError);
    }

    // Transform feedback choices into govukSelect items format
    const categoryItems = [
      {
        value: '',
        text: t('pages.caseDetails.operatorFeedback.categoryPlaceholder'),
        selected: true
      },
      ...feedbackChoicesResponse.data.map(choice => ({
        value: choice.value,
        text: choice.display_name,
        selected: false
      }))
    ];

    res.render('case_details/give-operator-feedback.njk', {
      caseReference,
      client: req.clientData,
      categoryItems,
      formData: {
        category: '',
        comment: ''
      },
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
    const processedError = createProcessedError(error, `rendering operator feedback form for case ${caseReference}`);
    next(processedError);
  }
}

/**
 * Handle operator feedback form submission
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {Promise<void>} Redirect to client details page
 */
export async function submitOperatorFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);

  if (!validCaseReference(caseReference, res)) {
    return;
  }

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

    const category = safeBodyString(req.body, 'category');
    const comment = safeBodyString(req.body, 'comment');

    // POST handlers don't have middleware, so fetch client details for validation error rendering
    const response = await apiService.getClientDetails(req.axiosMiddleware, caseReference);

    // Also fetch feedback choices for the form
    const feedbackChoicesResponse = await apiService.getFeedbackChoices(req.axiosMiddleware, caseReference);

    if (response.status === 'success' && response.data !== null && feedbackChoicesResponse.status === 'success' && feedbackChoicesResponse.data !== null) {
      // Transform feedback choices into govukSelect items format with selected state
      const categoryItems = [
        {
          value: '',
          text: t('pages.caseDetails.operatorFeedback.categoryPlaceholder'),
          selected: !category
        },
        ...feedbackChoicesResponse.data.map(choice => ({
          value: choice.value,
          text: choice.display_name,
          selected: category === choice.value
        }))
      ];

      return res.status(BAD_REQUEST).render('case_details/give-operator-feedback.njk', {
        caseReference,
        client: response.data,
        categoryItems,
        formData: {
          category,
          comment
        },
        errorState: {
          hasErrors: true,
          errors: errorSummaryList,
          fieldErrors
        },
        maxCommentLength: MAX_OPERATOR_FEEDBACK_COMMENT_LENGTH,
        characterThreshold: CHARACTER_THRESHOLD,
        csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined
      });
    }

    // If we can't fetch client details or feedback choices, pass error to handler
    const processedError = createProcessedError(
      new Error('Failed to fetch required data for validation error rendering'),
      `submitting operator feedback for case ${caseReference}`
    );
    return next(processedError);
  }

  // Validation passed - extract form data
  const category = safeString(safeBodyString(req.body, 'category'));
  const comment = safeString(safeBodyString(req.body, 'comment'));

  try {
    devLog(`Submitting operator feedback for case: ${caseReference}`);
    devLog(`Category: ${category}, Comment length: ${comment.length}`);

    // Submit operator feedback to API
    const response = await apiService.submitOperatorFeedback(
      req.axiosMiddleware,
      caseReference,
      {
        issue: category,
        comment: comment
      }
    );

    if (response.status === 'error') {
      const processedError = createProcessedError(
        new Error(response.message || 'Failed to submit operator feedback'),
        `submitting operator feedback for case ${caseReference}`
      );
      return next(processedError);
    }

    devLog(`Operator feedback submitted successfully for case: ${caseReference}`);

    // Redirect to client details page
    res.redirect(`/cases/${caseReference}/client-details`);
  } catch (error) {
    const processedError = createProcessedError(error, `submitting operator feedback for case ${caseReference}`);
    next(processedError);
  }
}

/**
 * Render the "do you want to give feedback" form
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {void} Rendered form page
 */
export async function getDoYouWantToGiveFeedbackForm(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);

  if (!validCaseReference(caseReference, res)) {
    return;
  }

  // if (!hasAllowedCaseStatus(req.clientData, ['closed','pending'])) {
  //   return res.redirect(`/cases/${caseReference}/client-details`);
  // }

  try {
    devLog(`Rendering "do you want to give feedback" form for case: ${caseReference}`);

    res.render('case_details/do-you-want-to-give-feedback.njk', {
      caseReference,
      client: req.clientData,
    });
  } catch (error) {
    const processedError = createProcessedError(error, `rendering "do you want to give feedback" form for case ${caseReference}`);
    next(processedError);
  }
}

/**
 * Handle "do you want to give feedback" form submission
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {Promise<void>} Redirect to client details page
 */
export async function submitDoYouWantToGiveFeedbackForm(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);

  const doYouWantToGiveFeedback = safeBodyString(req.body, 'doYouWantToGiveFeedback');

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

    // POST handlers don't have middleware, so fetch client details for validation error rendering
    const response = await apiService.getClientDetails(req.axiosMiddleware, caseReference);

    return res.status(BAD_REQUEST).render('case_details/do-you-want-to-give-feedback.njk', {
      caseReference,
      client: response.data,
      errorState: { hasErrors: true, errors: errorSummaryList, fieldErrors },
      csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined,
    });
  }

  if (doYouWantToGiveFeedback === 'true') {
    return res.redirect(`/cases/${caseReference}/give-operator-feedback`);
  }

  return res.redirect(`/cases/${caseReference}/client-details`);
}