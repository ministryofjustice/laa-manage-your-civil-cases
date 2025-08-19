import type { Request, Response, NextFunction } from 'express';
import { validationResult, type Result } from 'express-validator';
import { safeString, handleGetEditForm, isRecord, handlePostEditForm, extractAndConvertDateFields } from '#src/scripts/helpers/index.js';
import {
  formatValidationError,
  type ValidationErrorData
} from '#src/scripts/helpers/ValidationErrorHelpers.js';
import {
  parseDateString,
  handleDateOfBirthValidationErrors
} from '#src/scripts/helpers/ValidationDateHelpers.js';

/**
 * Custom data extractor for date of birth fields
 * @param {unknown} data - API response data
 * @returns {Record<string, unknown>} Extracted date components and original data
 */
function extractDateOfBirthData(data: unknown): Record<string, unknown> {
  let formData = { day: '', month: '', year: '' };
  let originalData = { day: '', month: '', year: '' };

  if (isRecord(data)) {
    const dateOfBirth = safeString(data.dateOfBirth);

    if (dateOfBirth !== '') {
      const parsedDate = parseDateString(dateOfBirth);
      formData = parsedDate;
      originalData = parsedDate;
    }
  }

  return {
    formData,
    originalData,
    errorState: { hasErrors: false, errors: [] }
  };
}

/**
 * Renders the edit client date of birth form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
export async function getEditClientDateOfBirth(req: Request, res: Response, next: NextFunction): Promise<void> {
  await handleGetEditForm(req, res, next, {
    templatePath: 'case_details/edit-date-of-birth.njk',
    dataExtractor: extractDateOfBirthData
  });
}

/**
 * Handles POST request for editing client date of birth form.
 * Uses hybrid approach: custom validation + existing POST helper for API call.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
export async function postEditClientDateOfBirth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validationErrors: Result<ValidationErrorData> = validationResult(req).formatWith(formatValidationError);

    if (!validationErrors.isEmpty()) {
      // Handle validation errors with date error handling
      const caseReference = safeString(req.params.caseReference);
      handleDateOfBirthValidationErrors(validationErrors, req, res, caseReference);
      return;
    }

    // Extract and transform date using the helper
    const dateOfBirth = extractAndConvertDateFields(req, [
      'dateOfBirth-day',
      'dateOfBirth-month',
      'dateOfBirth-year'
    ]);

    await handlePostEditForm(req, res, next, {
      templatePath: 'case_details/edit-date-of-birth.njk',
      fields: [
        { name: 'dateOfBirth', value: dateOfBirth, existingValue: '' }
      ],
      apiUpdateData: { dateOfBirth },
      useCustomValidation: false
    });

  } catch (error) {
    next(error);
  }
}
