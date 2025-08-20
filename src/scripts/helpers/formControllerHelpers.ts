import type { Request, Response, NextFunction } from 'express';
import 'csrf-sync'; // Import to ensure CSRF types are loaded
import { apiService } from '#src/services/apiService.js';
import { safeString, validateForm, capitaliseFirst, extractCurrentFields } from '#src/scripts/helpers/index.js';
import { validationResult } from 'express-validator';
import { formatValidationError } from '#src/scripts/helpers/ValidationErrorHelpers.js';
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

    let extractedData: Record<string, unknown> = {};
    if (options.fieldConfigs !== undefined) {
      // Use field configurations for data extraction
      extractedData = extractCurrentFields(response.data, options.fieldConfigs);
    } else if (options.dataExtractor !== undefined) {
      // Use custom data extractor function
      extractedData = options.dataExtractor(response.data);
    }

    const templateData = {
      caseReference,
      csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined,
      ...extractedData
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
    // Use express-validator validation - get raw errors first to access field information
    const rawValidationResult = validationResult(req);

    if (!rawValidationResult.isEmpty()) {
      const rawErrors = rawValidationResult.array();

      const resultingErrors = rawErrors.map((error) => {
        // Get field name from express-validator's path property
        const fieldName = 'path' in error && typeof error.path === 'string' ? error.path : '';

        // Format the error message
        const errorData = formatValidationError(error);

        return {
          fieldName,
          inlineMessage: errorData.inlineMessage,
          summaryMessage: errorData.summaryMessage,
        };
      });

      inputErrors = resultingErrors.reduce<Record<string, string>>((errors, { fieldName, inlineMessage }) => {
        if (inlineMessage.trim() !== '') {
          errors[fieldName] = inlineMessage;
        }
        return errors;
      }, {});

      errorSummaryList = resultingErrors.map(({ summaryMessage, fieldName }) => ({
        text: summaryMessage,
        href: `#${fieldName}`,
      }));

      formIsInvalid = true;
    }
  } else {
    // Use custom validation for name and email
    const validationData = fields.reduce<Record<string, string>>((data, { name, value, existingValue }) => {
      data[name] = value;
      data[`existing${capitaliseFirst(name)}`] = existingValue;
      return data;
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
