import type { Request, Response, NextFunction } from 'express';
import 'csrf-sync'; // Import to ensure CSRF types are loaded
import { handleGetEditForm, handlePostEditForm, extractFormFields } from '#src/scripts/helpers/index.js';

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

  const safeToContact = formFields.safeToCall === 'true' ? 'SAFE' : 'DONT_CALL';
  const announceCall = formFields.announceCall === 'true';
  
  await handlePostEditForm(req, res, next, {
    templatePath: 'case_details/edit-client-phone-number.njk',
    fields: [
      { name: 'safeToCall', value: formFields.safeToCall, existingValue: formFields.existingSafeToCall },
      { name: 'phoneNumber', value: formFields.phoneNumber, existingValue: formFields.existingPhoneNumber },
      { name: 'announceCall', value: formFields.announceCall, existingValue: formFields.existingAnnounceCall }
    ],
    apiUpdateData: {
      mobile_phone: formFields.phoneNumber,
      home_phone: "",
      safe_to_contact: safeToContact, 
      announce_call: announceCall
    }
  });
}