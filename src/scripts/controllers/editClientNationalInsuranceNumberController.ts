import type { Request, Response, NextFunction } from 'express';
import 'csrf-sync'; // Import to ensure CSRF types are loaded
import { handleGetEditForm, handlePostEditForm, extractFormFields } from '#src/scripts/helpers/index.js';

/**
 * Renders the edit client national insurance number form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function getEditClientNationalInsuranceNumber(req: Request, res: Response, next: NextFunction): Promise<void> {
  await handleGetEditForm(req, res, next, {
    templatePath: 'case_details/edit-client-national-insurance-number.njk',
    fieldConfigs: [
      { field: 'nationalInsuranceNumber', type: 'string', includeExisting: true }
    ]
  });
}

/**
 * Handles the submission of the  edit client national insurance number form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function postEditClientNationalInsuranceNumber(req: Request, res: Response, next: NextFunction): Promise<void> {
  const formFields = extractFormFields(req.body, ['nationalInsuranceNumber', 'existingNationalInsuranceNumber']);

  await handlePostEditForm(req, res, next, {
    templatePath: 'case_details/edit-client-national-insurance-number.njk',
    fields: [{ name: 'nationalInsuranceNumber', value: formFields.nationalInsuranceNumber, existingValue: formFields.existingNationalInsuranceNumber }],
    apiUpdateData: { ni_number: formFields.nationalInsuranceNumber }
  });
}
