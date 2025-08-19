import type { Request, Response, NextFunction } from 'express';
import 'csrf-sync'; // Import to ensure CSRF types are loaded
import { handleGetEditForm, handlePostEditForm, extractFormFields } from '#src/scripts/helpers/index.js';

/**
 * Renders the edit client address form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function getEditClientAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
  await handleGetEditForm(req, res, next, {
    templatePath: 'case_details/change-client-address.njk',
    fieldConfigs: [
      { field: 'address', type: 'string', includeExisting: true },
      { field: 'postcode', type: 'string', includeExisting: true }
    ]
  });
}

/**
 * Handles POST request for editing client address form.
 * Validates input and either displays errors or reloads the page.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function postEditClientAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
  const formFields = extractFormFields(req.body, [
    'address', 'existingAddress',
    'postcode', 'existingPostcode'
  ]);

  await handlePostEditForm(req, res, next, {
    templatePath: 'case_details/change-client-address.njk',
    fields: [
      { name: 'address', value: formFields.address, existingValue: formFields.existingAddress },
      { name: 'postcode', value: formFields.postcode, existingValue: formFields.existingPostcode }
    ],
    apiUpdateData: { address: formFields.address, postcode: formFields.postcode },
    useCustomValidation: true
  });
}