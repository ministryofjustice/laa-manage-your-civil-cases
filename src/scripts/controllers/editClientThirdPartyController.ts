import type { Request, Response, NextFunction } from 'express';
import 'csrf-sync'; // Import to ensure CSRF types are loaded
import { handleGetEditForm, handlePostEditForm, extractFormFields } from '#src/scripts/helpers/index.js';

/**
 * Renders the edit client third party form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function getEditClientThirdParty(req: Request, res: Response, next: NextFunction): Promise<void> {
  await handleGetEditForm(req, res, next, {
    templatePath: 'case_details/edit-client-third-party.njk',
    fieldConfigs: [
      { field: 'thirdPartyFullName', type: 'string', includeExisting: true }
    ]
  });
}

/**
 * Handles the submission of the edit third party form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function postEditClientThirdParty(req: Request, res: Response, next: NextFunction): Promise<void> {
  const formFields = extractFormFields(req.body, ['thirdPartyFullName', 'existingThirdPartyFullName']);

  await handlePostEditForm(req, res, next, {
    templatePath: 'case_details/edit-client-third-party.njk',
    fields: [{ name: 'thirdPartyFullName', value: formFields.thirdPartyFullName, existingValue: formFields.existingThirdPartyFullName }],
    apiUpdateData: { thirdParty: { fullName: formFields.thirdPartyFullName} }
  });
}
