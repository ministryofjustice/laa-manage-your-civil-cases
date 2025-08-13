import type { Request, Response, NextFunction } from 'express';
import { safeString } from '#src/scripts/helpers/index.js';
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
      csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles POST request for editing client date of birth form.
 * This will be expanded with validation in the next step.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object  
 * @param {NextFunction} next - Express next middleware function
 */
export async function postEditClientDateOfBirth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);
  
  try {
    // TODO: Add validation middleware and error handling
    // For now, just redirect back (this will be implemented in validation step)
    res.redirect(`/cases/${caseReference}/client-details`);
  } catch (error) {
    next(error);
  }
}
