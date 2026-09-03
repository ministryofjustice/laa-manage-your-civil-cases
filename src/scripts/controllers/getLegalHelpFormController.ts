import type { Request, Response, NextFunction } from 'express';
import { apiService } from '#src/services/apiService.js';
import { devLog, createProcessedError, safeString, validCaseReference, formatValidationError, safeBodyString, t, fetchProviderNameAndDetail, getSessionString } from '#src/scripts/helpers/index.js';
import { validationResult } from 'express-validator';
import { HTTP } from '#src/services/api/base/constants.js';
import config from '#config.js';
import { buildCategoryItems } from '../helpers/dataTransformers.js';

const { MAX_OPERATOR_FEEDBACK_COMMENT_LENGTH, CHARACTER_THRESHOLD }: { MAX_OPERATOR_FEEDBACK_COMMENT_LENGTH: number; CHARACTER_THRESHOLD: number } = config;

/**
 * Render the legal help form preview
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {void} Rendered form page
 */
export async function getLegalHelpForm(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);

  if (!validCaseReference(caseReference, res)) {
    return;
  }

  const response = await apiService.getLegalHelpExtract(req.axiosMiddleware, caseReference);
  let legalHelpExtract = response.data;

    res.render('case_details/legal_help_form/legal-help-form.njk', {
      caseReference,
      client: req.clientData,
      legalHelpExtract,
    });
}

/**
 * Handle "change category of law" form submission
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {Promise<void>} Redirect to client details page
 */
export async function submitLegalHelpForm(req: Request, res: Response, next: NextFunction): Promise<void> {
  
}