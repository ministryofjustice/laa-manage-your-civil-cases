import type { Request, Response, NextFunction } from 'express';
import 'csrf-sync'; // Import to ensure CSRF types are loaded
import { handleGetEditForm, handlePostEditForm, extractFormFields } from '#src/scripts/helpers/index.js';

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
    apiUpdateData: { email: formFields.emailAddress }
  });
}