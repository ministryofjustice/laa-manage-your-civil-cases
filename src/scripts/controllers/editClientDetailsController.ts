import type { Request, Response, NextFunction } from 'express';
import { apiService } from '#src/services/apiService.js';
import { safeString, hasProperty, validateForm } from '#src/scripts/helpers/index.js';

const BAD_REQUEST = 400;

/**
 * Renders the edit client name form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
export async function getEditClientName(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);
  try {
    const response = await apiService.getClientDetails(req.axiosMiddleware, caseReference);
    let currentName = '';
    if (response.status === 'success' && response.data !== null) {
      currentName = safeString(response.data.fullName);
    }
    res.render('case_details/edit-client-name.njk', {
      caseReference,
      currentName
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles the submission of the edit client name form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function postEditClientName(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);

  const fullName = hasProperty(req.body, 'fullName') ? safeString(req.body.fullName).trim() : '';
  const existingFullName = hasProperty(req.body, 'existingFullName') ? safeString(req.body.existingFullName).trim() : '';

  const { inputErrors, errorSummaryList, formIsInvalid } = validateForm({ fullName, existingFullName });

  if (formIsInvalid) {
    const renderOptions = {
      caseReference,
      currentName: fullName,
      existingFullName,
      error: {
        inputErrors,
        errorSummaryList
      },
      csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined,
    };
    res.status(BAD_REQUEST).render('case_details/edit-client-name.njk', renderOptions);
    return;
  }

  try {
    await apiService.updateClientDetails(req.axiosMiddleware, caseReference, { fullName });
    res.redirect(`/cases/${caseReference}/client-details`);
  } catch (error) {
    next(error);
  }
}