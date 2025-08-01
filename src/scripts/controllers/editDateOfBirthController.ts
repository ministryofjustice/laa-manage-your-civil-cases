import type { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { apiService } from '#src/services/apiService.js';
import { 
  safeString, 
  hasProperty, 
  formatDateForApi, 
  parseIsoDateToForm 
} from '#src/scripts/helpers/index.js';
import { formatValidationErrors } from '#src/middlewares/dateValidation.js';
import type { AxiosInstanceWrapper } from '#types/axios-instance-wrapper.js';

// Constants
const BAD_REQUEST = 400;

/**
 * Enhanced Request interface with middleware properties
 */
interface RequestWithMiddleware extends Request {
  axiosMiddleware: AxiosInstanceWrapper;
  csrfToken?: () => string;
}

/**
 * Extract form data from request body
 * @param {RequestWithMiddleware} req - Express request object
 * @returns {object} Extracted form data
 */
function extractFormData(req: RequestWithMiddleware): { day: string; month: string; year: string; originalDay: string; originalMonth: string; originalYear: string } {
  // Extract form data (express-validator doesn't modify the original request body)
  const day = hasProperty(req.body, 'dateOfBirth-day') ? safeString(req.body['dateOfBirth-day']).trim() : '';
  const month = hasProperty(req.body, 'dateOfBirth-month') ? safeString(req.body['dateOfBirth-month']).trim() : '';
  const year = hasProperty(req.body, 'dateOfBirth-year') ? safeString(req.body['dateOfBirth-year']).trim() : '';
  
  // Extract original data for change detection
  const originalDay = hasProperty(req.body, 'originalDay') ? safeString(req.body.originalDay).trim() : '';
  const originalMonth = hasProperty(req.body, 'originalMonth') ? safeString(req.body.originalMonth).trim() : '';
  const originalYear = hasProperty(req.body, 'originalYear') ? safeString(req.body.originalYear).trim() : '';

  return { day, month, year, originalDay, originalMonth, originalYear };
}

/**
 * GET client date of birth editing page for a specific case.
 * @param {RequestWithMiddleware} req - The request object with middleware
 * @param {Response} res - The response object  
 * @param {NextFunction} next - The next function
 * @returns {Promise<void>} Promise that resolves when operation completes
 */
export async function getEditDateOfBirth(req: RequestWithMiddleware, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);
  
  try {
    const response = await apiService.getRawClientDetails(req.axiosMiddleware, caseReference);
    
    let currentDay = '';
    let currentMonth = '';
    let currentYear = '';
    
    if (response.status === 'success' && response.data !== null && response.data.dateOfBirth !== '') {
      const parsed = parseIsoDateToForm(response.data.dateOfBirth);
      const { day, month, year } = parsed;
      currentDay = day;
      currentMonth = month;
      currentYear = year;
    }
    
    res.render('case_details/edit-date-of-birth.njk', {
      caseReference,
      currentDay,
      currentMonth,
      currentYear,
      formData: {
        day: currentDay,
        month: currentMonth,
        year: currentYear
      },
      originalData: {
        day: currentDay,
        month: currentMonth,
        year: currentYear
      },
      errorState: {
        hasErrors: false,
        errors: [],
        fieldErrors: {}
      },
      csrfToken: 'csrfToken' in req && typeof req.csrfToken === 'function' 
        ? req.csrfToken() 
        : ''
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST client date of birth update for a specific case.
 * @param {RequestWithMiddleware} req - The request object with middleware
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next function  
 * @returns {Promise<void>} Promise that resolves when operation completes
 */
export async function postEditDateOfBirth(req: RequestWithMiddleware, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);

  // Check for validation errors from express-validator middleware
  const errors = validationResult(req);
  
  // Extract form data
  const { day, month, year, originalDay, originalMonth, originalYear } = extractFormData(req);

  if (!errors.isEmpty()) {
    // Format errors for GOV.UK template
    const { inputErrors, errorSummaryList, formIsInvalid } = formatValidationErrors(errors.array());
    
    const renderOptions = {
      caseReference,
      currentDay: day,
      currentMonth: month,
      currentYear: year,
      originalDay,
      originalMonth,
      originalYear,
      formData: {
        day,
        month,
        year
      },
      originalData: {
        day: originalDay,
        month: originalMonth,
        year: originalYear
      },
      errorState: {
        hasErrors: formIsInvalid,
        errors: errorSummaryList,
        fieldErrors: inputErrors
      },
      error: {
        inputErrors,
        errorSummaryList
      },
      csrfToken: 'csrfToken' in req && typeof req.csrfToken === 'function' 
        ? req.csrfToken() 
        : undefined,
    };
    res.status(BAD_REQUEST).render('case_details/edit-date-of-birth.njk', renderOptions);
    return;
  }

  try {
    // Detect no change scenario
    if (day === originalDay && month === originalMonth && year === originalYear) {
      // Skip update if no date components have changed
      res.redirect(`/cases/${caseReference}/client-details`);
      return;
    }
    
    // Format date for API
    const formattedDate = formatDateForApi(day, month, year);
    
    // Update via API
    await apiService.updateClientDetails(req.axiosMiddleware, caseReference, { 
      dateOfBirth: formattedDate 
    });
    
    // Redirect on success
    res.redirect(`/cases/${caseReference}/client-details`);
  } catch (error) {
    next(error);
  }
}
