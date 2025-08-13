import type { Request, Response, NextFunction } from 'express';
import { validationResult, type Result } from 'express-validator';
import { safeString, hasProperty } from '#src/scripts/helpers/index.js';
import { formatValidationError, handleDateOfBirthValidationErrors, type ValidationErrorData } from '#src/scripts/helpers/ValidationErrorHelpers.js';
import { apiService } from '#src/services/apiService.js';

/**
 * Parse date string into day, month, year components
 * @param {string} dateString - ISO date string (YYYY-MM-DD) or empty string
 * @returns {object} Object with day, month, year properties
 */
function parseDateString(dateString: string): { day: string; month: string; year: string } {
  if (!dateString || dateString.trim() === '') {
    return { day: '', month: '', year: '' };
  }

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return { day: '', month: '', year: '' };
    }

    return {
      day: date.getDate().toString(),
      month: (date.getMonth() + 1).toString(), // getMonth() returns 0-11
      year: date.getFullYear().toString()
    };
  } catch {
    return { day: '', month: '', year: '' };
  }
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
      csrfToken: typeof (req as any).csrfToken === 'function' ? (req as any).csrfToken() : undefined,
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
      handleDateOfBirthValidationErrors(validationErrors, req, res, caseReference);
      return;
    }

    // No validation errors - construct date and save to data service
    const day = hasProperty(req.body, 'dateOfBirthDay') ? safeString(req.body.dateOfBirthDay) : '';
    const month = hasProperty(req.body, 'dateOfBirthMonth') ? safeString(req.body.dateOfBirthMonth) : '';
    const year = hasProperty(req.body, 'dateOfBirthYear') ? safeString(req.body.dateOfBirthYear) : '';
    
    // Construct ISO date string (YYYY-MM-DD) for API
    let dateOfBirth = '';
    if (day && month && year) {
      const paddedDay = day.padStart(2, '0');
      const paddedMonth = month.padStart(2, '0');
      dateOfBirth = `${year}-${paddedMonth}-${paddedDay}`;
    }
    
    await apiService.updateClientDetails(req.axiosMiddleware, caseReference, { 
      dateOfBirth 
    });
    
    res.redirect(`/cases/${caseReference}/client-details`);
    
  } catch (error) {
    next(error);
  }
}
