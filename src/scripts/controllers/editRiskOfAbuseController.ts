import type { Request, Response, NextFunction } from 'express';
import 'csrf-sync'; // Import to ensure CSRF types are loaded
import { 
  handleGetEditForm, 
  handlePostEditForm,
  extractFormFields
} from '#src/scripts/helpers/index.js';

/**
 * Renders the edit clients risk of abuse status.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function getEditRiskOfAbuse (req: Request, res: Response, next: NextFunction): Promise<void> {
  await handleGetEditForm(req, res, next, {
    templatePath: 'case_details/edit-risk-of-abuse.njk'
  });
}


/**
 * Handles the submission of the edit clients risk of abuse status.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function postEditRiskOfAbuse(req: Request, res: Response, next: NextFunction): Promise<void> {
  const formFields = extractFormFields(req.body, ['clientRiskOfAbuse', 'existingRiskOfAbuse']);
  
  await handlePostEditForm(req, res, next, {
    templatePath: 'case_details/edit-risk-of-abuse.njk',
    fields: [{ name: 'clientRiskOfAbuse', value: formFields.clientRiskOfAbuse, existingValue: formFields.existingRiskOfAbuse }],
    apiUpdateData: { vulnerable_user: formFields.clientRiskOfAbuse }
  });
  }

