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
