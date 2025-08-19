import type { Request, Response, NextFunction } from 'express';
import { validationResult, type Result } from 'express-validator';
import { safeString, hasProperty } from '#src/scripts/helpers/index.js';
import { 
  formatValidationError, 
  type ValidationErrorData
} from '#src/scripts/helpers/ValidationErrorHelpers.js';
import { 
  parseDateString,
  handleDateOfBirthValidationErrors
} from '#src/scripts/helpers/ValidationDateHelpers.js';
import { apiService } from '#src/services/apiService.js';
import { dateStringFromThreeFields } from '#src/scripts/helpers/dateFormatter.js';

// Interface for request with CSRF token
interface RequestWithCSRF extends Request {
  csrfToken?: () => string;
}
 
/**
 * Renders the edit client date of birth form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
export async function getEditClientDateOfBirth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);
  
  try {
    const response = await apiService.getClientDetails(req.axiosMiddleware, caseReference);
    
    let formData = { day: '', month: '', year: '' };
    let originalData = { day: '', month: '', year: '' };
    
    if (response.status === 'success' && response.data !== null) {
      const dateOfBirth = safeString(response.data.dateOfBirth);
      
      if (dateOfBirth !== '') {
        const parsedDate = parseDateString(dateOfBirth);
        formData = parsedDate;
        originalData = parsedDate;
      }
    }
    
    res.render('case_details/edit-date-of-birth.njk', {
      caseReference,
      formData,
      originalData,
      errorState: { hasErrors: false, errors: [] },
      csrfToken: (req as RequestWithCSRF).csrfToken?.(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles POST request for editing client date of birth form.
 * Validates input and either displays errors or updates the client details.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object  
 * @param {NextFunction} next - Express next middleware function
 */
export async function postEditClientDateOfBirth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);
  
  try {
    const validationErrors: Result<ValidationErrorData> = validationResult(req).formatWith(formatValidationError);
    
    if (!validationErrors.isEmpty()) {
      // Handle validation errors by rendering the form with error messages
      handleDateOfBirthValidationErrors(validationErrors, req, res, caseReference);
      return;
    }

    // No validation errors - construct date and save to data service
    const day = hasProperty(req.body, 'dateOfBirth-day') ? safeString(req.body['dateOfBirth-day']) : '';
    const month = hasProperty(req.body, 'dateOfBirth-month') ? safeString(req.body['dateOfBirth-month']) : '';
    const year = hasProperty(req.body, 'dateOfBirth-year') ? safeString(req.body['dateOfBirth-year']) : '';
    
    // Construct ISO date string (YYYY-MM-DD) for API
    let dateOfBirth = '';
    if (day !== '' && month !== '' && year !== '') {
      dateOfBirth = dateStringFromThreeFields(day, month, year);
    }
    
    await apiService.updateClientDetails(req.axiosMiddleware, caseReference, { 
      dateOfBirth 
    });
    
    res.redirect(`/cases/${caseReference}/client-details`);
    
  } catch (error) {
    next(error);
  }
}
