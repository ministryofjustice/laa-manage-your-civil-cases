import type { Request, Response, NextFunction } from 'express';
import 'csrf-sync'; // Import to ensure CSRF types are loaded
import { handleGetEditForm, handlePostEditForm, extractFormFields } from '#src/scripts/helpers/index.js';

/**
 * Removes whitespace and converts a National Insurance number to uppercase
 * @param {string} value - The National Insurance number to normalise
 * @returns {string} The normalised National Insurance number
 */
const normaliseNationalInsuranceNumber = (value: string): string => value.replace(/[^a-z0-9]/gi, '').toUpperCase();

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

  const existingNationalInsuranceNumber = normaliseNationalInsuranceNumber(String(formFields.existingNationalInsuranceNumber));

  await handlePostEditForm(req, res, next, {
    templatePath: 'case_details/edit-client-national-insurance-number.njk',
    fields: [{ name: 'nationalInsuranceNumber', value: formFields.nationalInsuranceNumber, existingValue: existingNationalInsuranceNumber }],
    apiUpdateData: { ni_number: formFields.nationalInsuranceNumber }
  });
}
