import type { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { apiService } from '#src/services/apiService.js';
import { devLog, createProcessedError, safeString, validCaseReference, formatValidationError, safeBodyString, normaliseSelectedCheckbox, trimOrUndefined, setSessionValue, getSessionValue, t, LEGAL_HELP_FORM_CIRCUMSTANCE_OPTIONS } from '#src/scripts/helpers/index.js';
import type { LegalHelpFormAnswers } from '#src/scripts/helpers/sessionHelpers.js';
import { HTTP } from '#src/services/api/base/constants.js';
import config from '#config.js';

const { MAX_LEGAL_HELP_FORM_EVIDENCE_LENGTH, CHARACTER_THRESHOLD }: { MAX_LEGAL_HELP_FORM_EVIDENCE_LENGTH: number; CHARACTER_THRESHOLD: number } = config;

const LEGAL_HELP_FORM_SESSION_KEY = 'legalHelpFormAnswers';

/**
 * Get the CSRF token for a request, if CSRF protection is enabled
 * @param {Request} req Express request object
 * @returns {string | undefined} The CSRF token, or undefined if unavailable
 */
function getCsrfToken(req: Request): string | undefined {
  return typeof req.csrfToken === 'function' ? req.csrfToken() : undefined;
}

/**
 * Build the govukCheckboxes items for the "about this case" additional circumstances field
 * @returns {Array<{ value: string; text: string; hint: { text: string } }>} Checkbox items with translated text
 */
function buildCircumstanceItems(): Array<{ value: string; text: string; hint: { text: string } }> {
  return LEGAL_HELP_FORM_CIRCUMSTANCE_OPTIONS.map(({ value, labelKey }) => ({
    value,
    text: t(`pages.caseDetails.getLegalHelpForm.circumstances.${labelKey}.label`),
    hint: { text: t(`pages.caseDetails.getLegalHelpForm.circumstances.${labelKey}.hint`) }
  }));
}

/**
 * Resolve selected additional circumstance values into their translated labels
 * @param {string[]} selectedValues - the raw additionalCircumstances values stored in session
 * @returns {string[]} Translated labels for the selected circumstances
 */
function resolveCircumstanceLabels(selectedValues: string[]): string[] {
  return LEGAL_HELP_FORM_CIRCUMSTANCE_OPTIONS
    .filter(({ value }) => selectedValues.includes(value))
    .map(({ labelKey }) => t(`pages.caseDetails.getLegalHelpForm.circumstances.${labelKey}.label`));
}

/**
 * Show the get legal help form interstitial page
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {void} Renders the get-legal-help-form page
 */
export function getLegalHelpFormInterstitial(req: Request, res: Response, next: NextFunction): void {
  const caseReference = safeString(req.params.caseReference);

  if (!validCaseReference(caseReference, res)) {
    return;
  }

  try {
    res.render('case_details/legal-help-form-interstitial.njk', {
      caseReference,
      client: req.clientData,
      currentEvidence: '',
      currentAdditionalCircumstances: [],
      maxEvidenceLength: MAX_LEGAL_HELP_FORM_EVIDENCE_LENGTH,
      characterThreshold: CHARACTER_THRESHOLD,
      circumstanceItems: buildCircumstanceItems(),
      csrfToken: getCsrfToken(req)
    });
  } catch (error) {
    const processedError = createProcessedError(error, `rendering get legal help form for case ${caseReference}`);
    next(processedError);
  }
}

/**
 * Handle the get legal help form submission. Answers are only kept in session for this instance
 * (never persisted to the API), ready to be displayed on the legal help form.
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {Promise<void>} Redirect to the legal help form
 */
export async function submitLegalHelpFormInterstitial(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);

  if (!validCaseReference(caseReference, res)) {
    return;
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const rawErrors = errors.array({ onlyFirstError: false });

    const validationErrors = rawErrors.map((error) => {
      const field = 'path' in error && typeof error.path === 'string' ? error.path : '';
      const { inlineMessage = '', summaryMessage } = formatValidationError(error);
      return { field, inlineMessage, summaryMessage };
    });

    const inputErrors = validationErrors.reduce<Record<string, string>>((acc, { field, inlineMessage }) => {
      acc[field] = inlineMessage.trim();
      return acc;
    }, {});

    const errorSummaryList = validationErrors.map(({ field, summaryMessage }) => ({
      text: summaryMessage,
      href: `#${field}`
    }));

    const currentEvidence = safeBodyString(req.body, 'evidence');
    const currentAdditionalCircumstances = normaliseSelectedCheckbox(safeBodyString(req.body, 'additionalCircumstances'));

    // POST handlers don't have middleware, so fetch client details for validation error rendering
    const response = await apiService.getClientDetails(req.axiosMiddleware, caseReference);

    if (response.status === 'success' && response.data !== null) {
      res.status(HTTP.BAD_REQUEST).render('case_details/legal-help-form-interstitial.njk', {
        caseReference,
        client: response.data,
        currentEvidence,
        currentAdditionalCircumstances,
        maxEvidenceLength: MAX_LEGAL_HELP_FORM_EVIDENCE_LENGTH,
        characterThreshold: CHARACTER_THRESHOLD,
        circumstanceItems: buildCircumstanceItems(),
        csrfToken: getCsrfToken(req),
        error: {
          inputErrors,
          errorSummaryList
        }
      });
      return;
    }

    // Don't mask a genuine fetch failure as a 404, pass it to the error handler instead
    const processedError = createProcessedError(
      new Error(response.message || 'Failed to fetch client details for validation error rendering'),
      `submitting get legal help form for case ${caseReference}`
    );
    next(processedError);
    return;
  }

  const evidence = trimOrUndefined(safeBodyString(req.body, 'evidence')) ?? '';
  const additionalCircumstances = normaliseSelectedCheckbox(safeBodyString(req.body, 'additionalCircumstances'));

  const answers: LegalHelpFormAnswers = { caseReference, evidence, additionalCircumstances };
  setSessionValue(req, LEGAL_HELP_FORM_SESSION_KEY, answers);

  devLog(`Storing get legal help form answers in session for case: ${caseReference}`);
  res.redirect(`/cases/${caseReference}/legal-help-form`);
}

/**
 * Show the legal help form, populated with the answers captured on the get legal help form interstitial page.
 * The full legal help form design/content is covered by a follow-up ticket; this renders a minimal read-only view.
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {void} Renders the legal-help-form page
 */
export function getLegalHelpForm(req: Request, res: Response, next: NextFunction): void {
  const caseReference = safeString(req.params.caseReference);

  if (!validCaseReference(caseReference, res)) {
    return;
  }

  try {
    const stored = getSessionValue(req, LEGAL_HELP_FORM_SESSION_KEY) as LegalHelpFormAnswers | undefined;
    // Ignore session answers left over from viewing a different case
    const answers = stored?.caseReference === caseReference ? stored : undefined;

    res.render('case_details/legal-help-form.njk', {
      caseReference,
      client: req.clientData,
      evidence: answers?.evidence ?? '',
      additionalCircumstances: resolveCircumstanceLabels(answers?.additionalCircumstances ?? [])
    });
  } catch (error) {
    const processedError = createProcessedError(error, `rendering legal help form for case ${caseReference}`);
    next(processedError);
  }
}

