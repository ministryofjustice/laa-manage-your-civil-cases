import type { Request, Response, NextFunction } from 'express';
import 'csrf-sync'; // Import to ensure CSRF types are loaded
import { apiService } from '#src/services/apiService.js';
import { safeString, hasProperty, validateForm, safeStringFromRecord } from '#src/scripts/helpers/index.js';
import { type Result, validationResult } from 'express-validator'

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

/**
 * Renders the edit client phone number form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
export async function getEditClientPhoneNumber(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);
  try {
    const response = await apiService.getClientDetails(req.axiosMiddleware, caseReference);
    let currentSafeToCall = '';
    let currentPhoneNumber = '';
    const safeToCall = response.data?.safeToCall
    const phoneNumber = response.data?.phoneNumber
    const announceCall = response.data?.announceCall
    if (response.status === 'success' && typeof phoneNumber === 'string' && typeof safeToCall === 'boolean') {
      currentSafeToCall = safeString(safeToCall)
      currentPhoneNumber = safeString(phoneNumber);
    }
    res.render('case_details/edit-client-phone-number.njk', {
      caseReference,
      currentSafeToCall,
      currentPhoneNumber,
      announceCall
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles the submission of the edit client phone number form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function postEditClientPhoneNumber(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);

  const safeToCall = hasProperty(req.body, 'safeToCall') ? safeString(req.body.safeToCall).trim() : '';
  const existingSafeToCall = hasProperty(req.body, 'existingSafeToCall') ? safeString(req.body.existingSafeToCall).trim() : '';

  const phoneNumber = hasProperty(req.body, 'phoneNumber') ? safeString(req.body.phoneNumber).trim() : '';
  const existingPhoneNumber = hasProperty(req.body, 'existingPhoneNumber') ? safeString(req.body.existingPhoneNumber).trim() : '';

  const announceCall = hasProperty(req.body, 'announceCall') ? req.body.announceCall : false;

  const validationErrors: Result = validationResult(req);

  if (!validationErrors.isEmpty()) {
    const resultingErrors = validationErrors.array().map((err: { msg: string }) => {
      const { msg } = err;

      let inlineMessage = msg;
      let summaryMessage = msg;

      const errorData = JSON.parse(msg) as unknown;
      inlineMessage = safeStringFromRecord(errorData, 'inlineMessage') ?? '';
      summaryMessage = safeStringFromRecord(errorData, 'summaryMessage') ?? '';

      return {
        fieldName: 'phoneNumber',
        inlineMessage,
        summaryMessage,
      };
    });

    const inputErrors = resultingErrors.reduce<Record<string, string>>((acc, { fieldName, inlineMessage }) => {
      acc[fieldName] = inlineMessage;
      return acc;
    }, {});

    const errorSummaryList = resultingErrors.map(({ summaryMessage, fieldName }) => ({
      text: summaryMessage,
      href: `#${fieldName}`,
    }));

    res.status(BAD_REQUEST).render('case_details/edit-client-phone-number.njk', {
      caseReference,
      currentSafeToCall: safeToCall,
      existingSafeToCall,
      currentPhoneNumber: phoneNumber,
      existingPhoneNumber,
      announceCall,
      error: {
        inputErrors,
        errorSummaryList
      },
      csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined,
    }); return;
  };

  try {
    await apiService.updateClientDetails(req.axiosMiddleware, caseReference, { safeToCall, phoneNumber });
    res.redirect(`/cases/${caseReference}/client-details`);
  } catch (error) {
    next(error);
  }
}