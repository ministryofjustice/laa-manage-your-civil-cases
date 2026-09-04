import type { Request, Response, NextFunction } from 'express';
import { apiService } from '#src/services/apiService.js';
import { safeString, validCaseReference } from '#src/scripts/helpers/index.js';

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