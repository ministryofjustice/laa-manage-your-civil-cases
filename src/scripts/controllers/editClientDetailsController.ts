import type { Request, Response, NextFunction } from 'express';
import 'csrf-sync'; // Import to ensure CSRF types are loaded
import { apiService } from '#src/services/apiService.js';
import { safeString, hasProperty, validateForm } from '#src/scripts/helpers/index.js';
import { type Result, validationResult } from 'express-validator';
import { formatValidationError, type ValidationErrorData } from '#src/scripts/helpers/ValidationErrorHelpers.js';

const BAD_REQUEST = 400;

// Extend the Express session type to include our search parameters
declare module 'express-session' {
  interface SessionData {
    stuff?: string;
    stuff2?: string;
    stuff3?: string;
    stuff4?: string;
    stuff5?: string;
    stuff6?: string;
  }
}
interface StuffStep1Body {
  stuff?: string;
  stuff2?: string;
  stuff3?: string;
}
interface StuffStep2Body {
  stuff4?: string;
  stuff5?: string;
  stuff6?: string;
}

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
    let currentPhoneNumber = '';
    let currentSafeToCall = '';
    let currentAnnounceCall = '';
    const safeToCall = response.data?.safeToCall
    const phoneNumber = response.data?.phoneNumber
    const announceCall = response.data?.announceCall
    if (response.status === 'success' && typeof phoneNumber === 'string' && typeof safeToCall === 'boolean' && typeof announceCall === 'boolean') {
      currentPhoneNumber = safeString(phoneNumber);
      currentSafeToCall = safeString(safeToCall)
      currentAnnounceCall = safeString(announceCall)
    }
    res.render('case_details/edit-client-phone-number.njk', {
      caseReference,
      currentPhoneNumber,
      currentSafeToCall,
      currentAnnounceCall
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

  const phoneNumber = hasProperty(req.body, 'phoneNumber') ? safeString(req.body.phoneNumber).trim() : '';
  const existingPhoneNumber = hasProperty(req.body, 'existingPhoneNumber') ? safeString(req.body.existingPhoneNumber).trim() : '';

  const safeToCall = hasProperty(req.body, 'safeToCall') ? safeString(req.body.safeToCall).trim() : '';
  const existingSafeToCall = hasProperty(req.body, 'existingSafeToCall') ? safeString(req.body.existingSafeToCall).trim() : '';
  
  const announceCall = hasProperty(req.body, 'announceCall') ? safeString(req.body.announceCall).trim() : '';
  const existingAnnounceCall = hasProperty(req.body, 'existingAnnounceCall') ? safeString(req.body.existingAnnounceCall).trim() : '';

  const validationErrors: Result<ValidationErrorData> = validationResult(req).formatWith(formatValidationError);

  if (!validationErrors.isEmpty()) {
    const resultingErrors = validationErrors.array().map((errorData: ValidationErrorData) => ({
      fieldName: 'phoneNumber',
      inlineMessage: errorData.inlineMessage,
      summaryMessage: errorData.summaryMessage,
    }));

    // Only use inline messages that are not empty
    const inputErrors = resultingErrors.reduce<Record<string, string>>((acc, { fieldName, inlineMessage }) => {
      if (inlineMessage.trim() !== '') {
        acc[fieldName] = inlineMessage;
      }
      return acc;
    }, {});

    const errorSummaryList = resultingErrors.map(({ summaryMessage, fieldName }) => ({
      text: summaryMessage,
      href: `#${fieldName}`,
    }));

    res.status(BAD_REQUEST).render('case_details/edit-client-phone-number.njk', {
      caseReference,
      currentPhoneNumber: phoneNumber,
      existingPhoneNumber,
      currentSafeToCall: safeToCall,
      existingSafeToCall,
      currentAnnounceCall: announceCall,
      existingAnnounceCall,
      error: {
        inputErrors,
        errorSummaryList
      },
      csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined,
    });
    return;
  }

  try {
    await apiService.updateClientDetails(req.axiosMiddleware, caseReference, { safeToCall, phoneNumber, announceCall });
    res.redirect(`/cases/${caseReference}/client-details`);
  } catch (error) {
    next(error);
  }
}

/**
 * Renders the change stuff form.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {void}
 */
export function getStuff(req: Request, res: Response, next: NextFunction): void {
  try {
    const { stuff = '', stuff2 = '', stuff3 = '' } = req.session;
    res.render('case_details/edit-stuff.njk', { stuff, stuff2, stuff3 });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles the submission of the change stuff form, and redirects to next form
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {void}
 */
export function postStuff(req: Request<Record<string, never>, unknown, StuffStep1Body>,res: Response,next: NextFunction): void {
  try {
    const { stuff = '', stuff2 = '', stuff3 = '' } = req.body ?? {};

    // Save to session
    req.session.stuff = stuff;
    req.session.stuff2 = stuff2;
    req.session.stuff3 = stuff3;

    req.session.save(err => {
      if (err) { next(err); return; }
      res.render('case_details/edit-stuff-continues.njk')
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Renders the change stuff-continues form.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {void}
 */
export function getStuffContinues(req: Request, res: Response, next: NextFunction): void {
  try {
    const {stuff = '', stuff2 = '', stuff3 = '', stuff4 = '', stuff5 = '', stuff6 = ''} = req.session;
    res.render('case_details/edit-stuff-continues.njk', { stuff, stuff2, stuff3, stuff4, stuff5, stuff6 });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles the submission of the change stuff-continues form.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function postStuffContinues(req: Request<Record<string, never>, unknown, StuffStep2Body>, res: Response, next: NextFunction): Promise<void> {
  try {

    // 1) Read what we already saved from step 1
    const { stuff = '', stuff2 = '', stuff3 = '' } = req.session;

    // 2) Read what’s just been posted on step 2
    const { stuff4 = '', stuff5 = '', stuff6 = '' } = req.body ?? {};

    // 3) Payload for API
    const payload = { stuff, stuff2, stuff3, stuff4, stuff5, stuff6 };

    // 4) Call your backend (replace with your real service)
    // await apiService.saveStuff(req.axiosMiddleware, payload);

    // 6) Clear wizard fields
    delete req.session.stuff;
    delete req.session.stuff2;
    delete req.session.stuff3;
    delete req.session.stuff4;
    delete req.session.stuff5;
    delete req.session.stuff6;

    res.redirect('/cases/new');
  } catch (error) {
    next(error);
  }
}