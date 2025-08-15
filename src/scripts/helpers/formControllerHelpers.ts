import type { Request, Response, NextFunction } from 'express';
import 'csrf-sync'; // Import to ensure CSRF types are loaded
import { apiService } from '#src/services/apiService.js';
import { safeString,validateForm, capitaliseFirst } from '#src/scripts/helpers/index.js';
import { type Result, validationResult } from 'express-validator';
import { formatValidationError, type ValidationErrorData } from '#src/scripts/helpers/ValidationErrorHelpers.js';
import type {
  RenderData,
  GetFormOptions,
  PostFormOptions,
  ValidationResult
} from '#types/form-controller-types.js';

const BAD_REQUEST = 400;

/**
 * Generic function to handle GET requests for edit forms
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @param {GetFormOptions} options - Configuration options for the form handler
 * @returns {Promise<void>}
 */
export async function handleGetEditForm(
  req: Request,
  res: Response,
  next: NextFunction,
  options: GetFormOptions
): Promise<void> {
  const caseReference = safeString(req.params.caseReference);
  try {
    const response = await apiService.getClientDetails(req.axiosMiddleware, caseReference);
    const templateData = {
      caseReference,
      ...options.dataExtractor(response.data)
    };
    res.render(options.templatePath, templateData);
  } catch (error) {
    next(error);
  }
}

/**
 * Generic function to handle POST requests for edit forms
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @param {PostFormOptions} options - Configuration options for the form handler
 * @returns {Promise<void>}
 */
export async function handlePostEditForm(
  req: Request,
  res: Response,
  next: NextFunction,
  options: PostFormOptions
): Promise<void> {
  const caseReference = safeString(req.params.caseReference);
  const { templatePath, fields, apiUpdateData, useCustomValidation = false } = options;

  let inputErrors: Record<string, string> = {};
  let errorSummaryList: Array<{ text: string; href: string }> = [];
  let formIsInvalid = false;

  if (useCustomValidation) {
    // Use express-validator for phone number validation
    const validationErrors: Result<ValidationErrorData> = validationResult(req).formatWith(formatValidationError);

    if (!validationErrors.isEmpty()) {
      const resultingErrors = validationErrors.array().map((errorData: ValidationErrorData) => ({
        fieldName: 'phoneNumber',
        inlineMessage: errorData.inlineMessage,
        summaryMessage: errorData.summaryMessage,
      }));

      inputErrors = resultingErrors.reduce<Record<string, string>>((acc, { fieldName, inlineMessage }) => {
        if (inlineMessage.trim() !== '') {
          acc[fieldName] = inlineMessage;
        }
        return acc;
      }, {});

      errorSummaryList = resultingErrors.map(({ summaryMessage, fieldName }) => ({
        text: summaryMessage,
        href: `#${fieldName}`,
      }));

      formIsInvalid = true;
    }
  } else {
    // Use custom validation for name and email
    const validationData = fields.reduce<Record<string, string>>((acc, { name, value, existingValue }) => {
      acc[name] = value;
      // Special case for email validation which expects 'existingEmail' not 'existingEmailAddress'
      const existingKey = name === 'emailAddress' ? 'existingEmail' : `existing${capitaliseFirst(name)}`;
      acc[existingKey] = existingValue;
      return acc;
    }, {});

    const validation: ValidationResult = validateForm(validationData);
    ({ inputErrors, formIsInvalid } = validation);
    errorSummaryList = validation.errorSummaryList.map(summary => ({
      text: summary.text,
      href: summary.href ?? ''
    }));
  }

  if (formIsInvalid) {
    const renderData: RenderData = {
      caseReference,
      error: { inputErrors, errorSummaryList },
      csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined,
    };

    // Add current values to render data
    fields.forEach(({ name, value, existingValue }) => {
      renderData[`current${capitaliseFirst(name)}`] = value;
      renderData[`existing${capitaliseFirst(name)}`] = existingValue;
    });

    // Add any additional fields from apiUpdateData
    Object.entries(apiUpdateData).forEach(([key, value]) => {
      if (!fields.some(({ name }) => name === key)) {
        renderData[key] = value;
      }
    });

    res.status(BAD_REQUEST).render(templatePath, renderData);
    return;
  }

  try {
    await apiService.updateClientDetails(req.axiosMiddleware, caseReference, apiUpdateData);
    res.redirect(`/cases/${caseReference}/client-details`);
  } catch (error) {
    next(error);
  }
}
