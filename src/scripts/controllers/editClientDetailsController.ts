import type { Request, Response, NextFunction } from 'express';
import 'csrf-sync'; // Import to ensure CSRF types are loaded
import { handleGetEditForm, handlePostEditForm, extractFormFields } from '#src/scripts/helpers/index.js';


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
    fieldConfigs: [
      { field: 'fullName', type: 'string', includeExisting: true }
    ]
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
  const formFields = extractFormFields(req.body, ['fullName', 'existingFullName']);

  await handlePostEditForm(req, res, next, {
    templatePath: 'case_details/edit-client-name.njk',
    fields: [{ name: 'fullName', value: formFields.fullName, existingValue: formFields.existingFullName }],
    apiUpdateData: { fullName: formFields.fullName }
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
    fieldConfigs: [
      { field: 'emailAddress', type: 'string', includeExisting: true }
    ]
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
  const formFields = extractFormFields(req.body, ['emailAddress', 'existingEmailAddress']);

  await handlePostEditForm(req, res, next, {
    templatePath: 'case_details/edit-client-email-address.njk',
    fields: [{ name: 'emailAddress', value: formFields.emailAddress, existingValue: formFields.existingEmailAddress }],
    apiUpdateData: { emailAddress: formFields.emailAddress }
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
    fieldConfigs: [
      { field: 'safeToCall', type: 'boolean', includeExisting: true },
      { field: 'phoneNumber', type: 'string', includeExisting: true },
      { field: 'announceCall', keepOriginal: true, includeExisting: true }
    ]
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
  const formFields = extractFormFields(req.body, [
    'safeToCall', 'existingSafeToCall',
    'phoneNumber', 'existingPhoneNumber',
    'announceCall', 'existingAnnounceCall'
  ]);

  await handlePostEditForm(req, res, next, {
    templatePath: 'case_details/edit-client-phone-number.njk',
    fields: [
      { name: 'safeToCall', value: formFields.safeToCall, existingValue: formFields.existingSafeToCall },
      { name: 'phoneNumber', value: formFields.phoneNumber, existingValue: formFields.existingPhoneNumber },
      { name: 'announceCall', value: formFields.announceCall, existingValue: formFields.existingAnnounceCall }
    ],
    apiUpdateData: {
      safeToCall: formFields.safeToCall,
      phoneNumber: formFields.phoneNumber,
      announceCall: formFields.announceCall
    },
    useCustomValidation: true
  });
}