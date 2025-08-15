import type { Request, Response, NextFunction } from 'express';
import 'csrf-sync'; // Import to ensure CSRF types are loaded
import { safeString, hasProperty, isRecord, handleGetEditForm, handlePostEditForm } from '#src/scripts/helpers/index.js';


/**
 * Renders the edit client name form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function getEditClientName(req: Request, res: Response, next: NextFunction): Promise<void> {
  await handleGetEditForm(req, res, next, {
    templatePath: 'case_details/edit-client-name.njk',
    /**
     * Extracts current name data from API response
     * @param {unknown} data - API response data
     * @returns {object} Object containing current name for form
     */
    dataExtractor: (data: unknown) => ({
      currentName: isRecord(data) && typeof data.fullName === 'string'
        ? safeString(data.fullName)
        : ''
    })
  });
}

/**
 * Handles the submission of the edit client name form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function postEditClientName(req: Request, res: Response, next: NextFunction): Promise<void> {
  const fullName = hasProperty(req.body, 'fullName') ? safeString(req.body.fullName).trim() : '';
  const existingFullName = hasProperty(req.body, 'existingFullName') ? safeString(req.body.existingFullName).trim() : '';

  await handlePostEditForm(req, res, next, {
    templatePath: 'case_details/edit-client-name.njk',
    fields: [{ name: 'fullName', value: fullName, existingValue: existingFullName }],
    apiUpdateData: { fullName }
  });
}

/**
 * Renders the edit client email address form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function getEditClientEmailAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
  await handleGetEditForm(req, res, next, {
    templatePath: 'case_details/edit-client-email-address.njk',
    /**
     * Extracts current email data from API response
     * @param {unknown} data - API response data
     * @returns {object} Object containing current email for form
     */
    dataExtractor: (data: unknown) => ({
      currentEmail: isRecord(data) && typeof data.emailAddress === 'string'
        ? safeString(data.emailAddress)
        : ''
    })
  });
}

/**
 * Handles the submission of the edit client email form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function postEditClientEmailAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
  const emailAddress = hasProperty(req.body, 'emailAddress') ? safeString(req.body.emailAddress).trim() : '';
  const existingEmail = hasProperty(req.body, 'existingEmail') ? safeString(req.body.existingEmail).trim() : '';

  await handlePostEditForm(req, res, next, {
    templatePath: 'case_details/edit-client-email-address.njk',
    fields: [{ name: 'emailAddress', value: emailAddress, existingValue: existingEmail }],
    apiUpdateData: { emailAddress }
  });
}

/**
 * Renders the edit client phone number form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function getEditClientPhoneNumber(req: Request, res: Response, next: NextFunction): Promise<void> {
  await handleGetEditForm(req, res, next, {
    templatePath: 'case_details/edit-client-phone-number.njk',
    /**
     * Extracts current phone data from API response
     * @param {unknown} data - API response data
     * @returns {object} Object containing current phone data for form
     */
    dataExtractor: (data: unknown) => ({
      currentSafeToCall: isRecord(data) && typeof data.safeToCall === 'boolean'
        ? safeString(data.safeToCall)
        : '',
      currentPhoneNumber: isRecord(data) && typeof data.phoneNumber === 'string'
        ? safeString(data.phoneNumber)
        : '',
      announceCall: isRecord(data) && hasProperty(data, 'announceCall')
        ? data.announceCall
        : undefined
    })
  });
}

/**
 * Handles the submission of the edit client phone number form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function postEditClientPhoneNumber(req: Request, res: Response, next: NextFunction): Promise<void> {
  const safeToCall = hasProperty(req.body, 'safeToCall') ? safeString(req.body.safeToCall).trim() : '';
  const existingSafeToCall = hasProperty(req.body, 'existingSafeToCall') ? safeString(req.body.existingSafeToCall).trim() : '';
  const phoneNumber = hasProperty(req.body, 'phoneNumber') ? safeString(req.body.phoneNumber).trim() : '';
  const existingPhoneNumber = hasProperty(req.body, 'existingPhoneNumber') ? safeString(req.body.existingPhoneNumber).trim() : '';
  const announceCall = hasProperty(req.body, 'announceCall') ? req.body.announceCall : false;

  await handlePostEditForm(req, res, next, {
    templatePath: 'case_details/edit-client-phone-number.njk',
    fields: [
      { name: 'safeToCall', value: safeToCall, existingValue: existingSafeToCall },
      { name: 'phoneNumber', value: phoneNumber, existingValue: existingPhoneNumber }
    ],
    apiUpdateData: { safeToCall, phoneNumber, announceCall },
    useCustomValidation: true
  });
}