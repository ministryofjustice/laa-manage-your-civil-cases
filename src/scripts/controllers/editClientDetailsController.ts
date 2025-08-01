import type { Request, Response, NextFunction } from 'express';
import 'csrf-sync'; // Import to ensure CSRF types are loaded
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

/**
 * Renders the edit client email address form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
export async function getEditClientEmailAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);
  try {
    const response = await apiService.getClientDetails(req.axiosMiddleware, caseReference);
    let currentEmail = '';
    const email = response.data?.emailAddress
    if (response.status === 'success' && typeof email === 'string') {
      currentEmail = safeString(email);
    }
    res.render('case_details/edit-client-email-address.njk', {
      caseReference,
      currentEmail
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles the submission of the edit client email form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function postEditClientEmailAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);

  const emailAddress = hasProperty(req.body, 'emailAddress') ? safeString(req.body.emailAddress).trim() : '';
  const existingEmail = hasProperty(req.body, 'existingEmail') ? safeString(req.body.existingEmail).trim() : '';

  const { inputErrors, errorSummaryList, formIsInvalid } = validateForm({ emailAddress, existingEmail });

  if (formIsInvalid) {
    const renderOptions = {
      caseReference,
      currentEmail: emailAddress,
      existingEmail,
      error: {
        inputErrors,
        errorSummaryList
      },
      csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined,
    };
    res.status(BAD_REQUEST).render('case_details/edit-client-email-address.njk', renderOptions);
    return;
  }

  try {
    await apiService.updateClientDetails(req.axiosMiddleware, caseReference, { emailAddress });
    res.redirect(`/cases/${caseReference}/client-details`);
  } catch (error) {
    next(error);
  }
}