import type { Request, Response, NextFunction } from 'express';
import 'csrf-sync'; // Import to ensure CSRF types are loaded
import { apiService } from '#src/services/apiService.js';
import { safeString, capitaliseFirst, extractCurrentFields } from '#src/scripts/helpers/index.js';
import { validationResult } from 'express-validator';
import { formatValidationError } from '#src/scripts/helpers/ValidationErrorHelpers.js';
import type {
  RenderData,
  GetFormOptions,
  PostFormOptions,
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
  const { templatePath, fields, apiUpdateData } = options;

  let inputErrors: Record<string, string> = {};
  let errorSummaryList: Array<{ text: string; href: string }> = [];
  let formIsInvalid = false;

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

/**
 * Handles validation errors and renders the form with error messages
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {string} caseReference - Case reference number
 * @param {Record<string, unknown>} formFields - Form field values
 * @param {string} templatePath - Optional template path (defaults to add template)
 * @returns {boolean} - Returns true if there were validation errors, false otherwise
 */
export function handleThirdPartyValidationErrors(
  req: Request,
  res: Response,
  caseReference: string,
  formFields: Record<string, unknown>,
  templatePath = 'case_details/third_party_details/add-client-third-party.njk'
): boolean {
  const rawValidationResult = validationResult(req);

  if (rawValidationResult.isEmpty()) {
    return false;
  }

  const rawErrors = rawValidationResult.array();

  const resultingErrors = rawErrors.map((error) => {
    const fieldName = 'path' in error && typeof error.path === 'string' ? error.path : '';
    const errorData = formatValidationError(error);

    return {
      fieldName,
      inlineMessage: errorData.inlineMessage,
      summaryMessage: errorData.summaryMessage,
    };
  });

  const inputErrors = resultingErrors.reduce((errors: Record<string, string>, { fieldName, inlineMessage }) => {
    if (inlineMessage.trim() !== '') {
      errors[fieldName] = inlineMessage;
    }
    return errors;
  }, {});

  const errorSummaryList = resultingErrors.map(({ summaryMessage, fieldName }) => ({
    text: summaryMessage,
    href: `#${fieldName}`,
  }));

  const renderData = {
    caseReference,
    error: { inputErrors, errorSummaryList },
    csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined,
    currentThirdPartyFullName: formFields.thirdPartyFullName,
    currentThirdPartyEmailAddress: formFields.thirdPartyEmailAddress,
    currentThirdPartyContactNumber: formFields.thirdPartyContactNumber,
    currentThirdPartySafeToCall: formFields.thirdPartySafeToCall,
    currentThirdPartyAddress: formFields.thirdPartyAddress,
    currentThirdPartyPostcode: formFields.thirdPartyPostcode,
    currentThirdPartyRelationshipToClient: formFields.thirdPartyRelationshipToClient,
    currentThirdPartyPassphraseSetUp: formFields.thirdPartyPassphraseSetUp,
    currentThirdPartyPassphrase: formFields.thirdPartyPassphrase,
    // Include existing values for edit forms (will be undefined for add forms)
    existingThirdPartyFullName: formFields.existingThirdPartyFullName,
    existingThirdPartyEmailAddress: formFields.existingThirdPartyEmailAddress,
    existingThirdPartyContactNumber: formFields.existingThirdPartyContactNumber,
    existingThirdPartySafeToCall: formFields.existingThirdPartySafeToCall,
    existingThirdPartyAddress: formFields.existingThirdPartyAddress,
    existingThirdPartyPostcode: formFields.existingThirdPartyPostcode,
    existingThirdPartyRelationshipToClient: formFields.existingThirdPartyRelationshipToClient,
    existingThirdPartyPassphraseSetUp: formFields.existingThirdPartyPassphraseSetUp,
    existingThirdPartyPassphrase: formFields.existingThirdPartyPassphrase
  };

  res.status(BAD_REQUEST).render(templatePath, renderData);
  return true;
}

/**
 * Prepares third party data for API submission
 * @param {Record<string, unknown>} formFields - Form field values
 * @returns {object} - Formatted third party data for API
 */
export function prepareThirdPartyData(formFields: Record<string, unknown>): object {
  return {
    fullName: formFields.thirdPartyFullName,
    emailAddress: formFields.thirdPartyEmailAddress,
    contactNumber: formFields.thirdPartyContactNumber,
    safeToCall: formFields.thirdPartySafeToCall !== '' ? formFields.thirdPartySafeToCall : true,
    address: formFields.thirdPartyAddress,
    postcode: formFields.thirdPartyPostcode,
    relationshipToClient: {
      selected: Array.isArray(formFields.thirdPartyRelationshipToClient) ? formFields.thirdPartyRelationshipToClient : [formFields.thirdPartyRelationshipToClient]
    },
    passphraseSetUp: {
      selected: Array.isArray(formFields.thirdPartyPassphraseSetUp) ? formFields.thirdPartyPassphraseSetUp : [formFields.thirdPartyPassphraseSetUp],
      passphrase: formFields.thirdPartyPassphrase
    }
  };
}