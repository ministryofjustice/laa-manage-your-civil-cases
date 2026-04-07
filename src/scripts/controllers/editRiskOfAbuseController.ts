import type { Request, Response, NextFunction } from 'express';
import 'csrf-sync'; // Import to ensure CSRF types are loaded
import { 
  handleGetEditForm, 
  handlePostEditForm,
  extractFormFields,
  safeString,
  isRecord,
  hasProperty,
  extractCurrentFields,
  safeNestedField,
  storeOriginalFormData,
  isYes,
  capitaliseFirstLetter,
} from '#src/scripts/helpers/index.js';
import { apiService } from '#src/services/apiService.js';
import languages from '#views/case_details/client_support_needs/languages.json' with { type: 'json' };


/**
 * Renders the edit clients risk of abuse status.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function getEditRiskOfAbuse (req: Request, res: Response, next: NextFunction): Promise<void> {
 res.locals.languageItems = languages;
  await handleGetEditForm(req, res, next, {
    templatePath: 'case_details/risk-of-abuse.njk',
 
  });
}

/**
 * Handles the submission of the edit clients risk of abuse status..
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function postEditRiskOfAbuse(req: Request, res: Response, next: NextFunction): Promise<void> {
  console.log('RAW req.body:', req.body);
  const formFields = extractFormFields(req.body, ['clientRiskOfAbuse', 'existingRiskOfAbuse']);
  console.log('EXTRACTED formFields:', formFields);
  res.locals.languageItems = languages;
  await handlePostEditForm(req, res, next, {
    templatePath: 'case_details/risk-of-abuse.njk',

    fields: [{ name: 'clientRiskOfAbuse', value: formFields.clientRiskOfAbuse, existingValue: formFields.existingRiskOfAbuse }],
    apiUpdateData: { vulnerable_user: formFields.clientRiskOfAbuse }
 
  });
  }

