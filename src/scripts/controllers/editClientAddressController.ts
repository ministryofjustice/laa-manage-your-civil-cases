import type { Request, Response, NextFunction } from 'express';
import { validationResult, type Result } from 'express-validator';
import { safeString, hasProperty } from '#src/scripts/helpers/index.js';
import { formatValidationError, handleValidationErrors, type ValidationErrorData } from '#src/scripts/helpers/ValidationErrorHelpers.js';
import { apiService } from '#src/services/apiService.js';

/**
 * Renders the edit client address form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
export async function getEditClientAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);
  try {
    const response = await apiService.getClientDetails(req.axiosMiddleware, caseReference);
    let currentAddress = '';
    let currentPostcode = '';
    let existingAddress = '';
    let existingPostcode = '';
    
    if (response.status === 'success' && response.data !== null) {
      const address = safeString(response.data.address);
      const postcode = safeString(response.data.postcode);
      
      if (address !== '') {
        currentAddress = address;
        existingAddress = address;
      }
      
      if (postcode !== '') {
        currentPostcode = postcode;
        existingPostcode = postcode;
      }
    }
    
    res.render('case_details/edit-client-address.njk', {
      caseReference,
      currentAddress,
      currentPostcode,
      existingAddress,
      existingPostcode,
      csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles POST request for editing client address form.
 * Validates input and either displays errors or reloads the page.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object  
 * @param {NextFunction} next - Express next middleware function
 */
export async function postEditClientAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);
  
  try {
    const validationErrors: Result<ValidationErrorData> = validationResult(req).formatWith(formatValidationError);
    
    if (!validationErrors.isEmpty()) {
      handleValidationErrors(validationErrors, req, res, caseReference);
      return;
    }

    // No validation errors - save to data service and redirect to client details
    const address = hasProperty(req.body, 'address') ? safeString(req.body.address) : '';
    const postcode = hasProperty(req.body, 'postcode') ? safeString(req.body.postcode) : '';
    
    await apiService.updateClientDetails(req.axiosMiddleware, caseReference, { 
      address, 
      postcode 
    });
    
    res.redirect(`/cases/${caseReference}/client-details`);
    
  } catch (error) {
    next(error);
  }
}
