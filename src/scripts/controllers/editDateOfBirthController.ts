/**
 * Enhanced Date of Birth Controller with Simplified Error Processing
 * 
 * This controller integrates seamlessly with the new direct schema validation
 * architecture implemented in Phase 1.4. Key improvements:
 * 
 * - Direct error processing from simplified schema validation
 * - Enhanced type safety with comprehensive error handling
 * - Streamlined field highlighting logic optimized for new validation approach
 * - Improved error debugging and transparency
 * - Robust fallbacks and edge case handling
 * 
 * @version 2.0.0 - Enhanced for direct schema validation compatibility
 * @since 2025-08-06
 */

import type { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { apiService } from '#src/services/apiService.js';
import { safeString } from '#src/scripts/helpers/index.js';
import {
  type RequestWithMiddleware,
  extractFormData,
  populateExistingDate,
  generateCsrfToken,
  processValidationErrors,
  createErrorRenderOptions,
  handleSuccessfulUpdate
} from './helpers/editDateOfBirthHelpers.js';

// Constants
const EMPTY_VALUE = 0;
const BAD_REQUEST_STATUS = 400;
const BAD_REQUEST = BAD_REQUEST_STATUS;

/**
 * Enhanced GET client date of birth editing page for a specific case
 * 
 * This function provides comprehensive error handling and logging for the date of birth
 * editing form display. Enhanced with robust API error handling and fallback behavior.
 * 
 * @param {RequestWithMiddleware} req - The request object with middleware
 * @param {Response} res - The response object  
 * @param {NextFunction} next - The next function
 * @returns {Promise<void>} Promise that resolves when operation completes
 */
export async function getEditDateOfBirth(req: RequestWithMiddleware, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);

  try {
    // Enhanced API call with comprehensive error handling
    const response = await apiService.getRawClientDetails(req.axiosMiddleware, caseReference);
    const { currentDay, currentMonth, currentYear } = populateExistingDate(response);
    
    // Enhanced template data with comprehensive error state
    const templateData = {
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
        fieldErrors: {},
        totalErrorCount: EMPTY_VALUE,
        globalErrorCount: EMPTY_VALUE
      },
      csrfToken: generateCsrfToken(req)
    };
    
    res.render('case_details/edit-date-of-birth.njk', templateData);
  } catch (error) {
    console.error('❌ Error in getEditDateOfBirth:', error);
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

  // Get validation results from express-validator
  const validationErrors = validationResult(req);
  
  // Extract form data
  const formData = extractFormData(req);

  if (!validationErrors.isEmpty()) {
    // Enhanced error array processing with type safety
    const rawErrors = validationErrors.array();
    const govUkErrors = processValidationErrors(rawErrors);
    
    // Use the validated error array for processing
    const renderOptions = createErrorRenderOptions(caseReference, formData, govUkErrors, req);
    
    res.status(BAD_REQUEST).render('case_details/edit-date-of-birth.njk', renderOptions);
    return;
  }

  try {
    await handleSuccessfulUpdate(req, caseReference, formData);
    
    res.redirect(`/cases/${caseReference}/client-details`);
  } catch (error) {
    console.error('❌ Unexpected error in postEditDateOfBirth:', error);
    next(error);
  }
}
