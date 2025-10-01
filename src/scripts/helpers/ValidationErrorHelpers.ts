import type { ValidationError, Result, Meta, Location } from 'express-validator';
import type { Request, Response } from 'express';
import { isRecord, hasProperty, safeString } from './dataTransformers.js';
import { i18next } from './i18nLoader.js';

/**
 * Interface for validation error data structure
 */
export interface ValidationErrorData {
  summaryMessage: string;
  inlineMessage: string;
  fieldPath?: string; // Add field path from express-validator
}

/**
 * Custom error class that extends Error and carries ValidationErrorData
 * This satisfies linting rules while providing type safety
 */
export class TypedValidationError extends Error {
  public readonly errorData: ValidationErrorData;

  /**
   * Creates a new TypedValidationError with structured error data
   * @param {ValidationErrorData} errorData - The validation error data containing summary and inline messages
   */
  constructor(errorData: ValidationErrorData) {
    super(errorData.summaryMessage);
    this.name = 'TypedValidationError';
    this.errorData = errorData;
  }
}

/**
 * Custom error formatter for express-validator that preserves type safety
 * This is the express-validator recommended approach using formatWith()
 * @param {ValidationError} error - The express-validator error object
 * @returns {ValidationErrorData} Typed error data object
 */
export function formatValidationError(error: ValidationError): ValidationErrorData {
  // Handle TypedValidationError instances
  if (error.msg instanceof TypedValidationError) {
    return error.msg.errorData;
  }

  // Handle the case where the error message is already our ValidationErrorData using existing helpers
  if (isRecord(error.msg) &&
    hasProperty(error.msg, 'summaryMessage') &&
    hasProperty(error.msg, 'inlineMessage')) {
    return {
      summaryMessage: safeString(error.msg.summaryMessage),
      inlineMessage: safeString(error.msg.inlineMessage)
    };
  }

  // Fallback: treat the message as both summary and inline
  const safeMessage = safeString(error.msg);
  const message = safeMessage !== '' ? safeMessage : 'Invalid value';
  return {
    summaryMessage: message,
    inlineMessage: message
  };
}

/**
 * Creates a change detection validator that checks if any of the specified field pairs have changed
 * @param {Array<{ current: string; original: string }>} fieldMappings - Array of {current, original} field name pairs to compare
 * @param {object} errorMessage - Error message to show when no changes detected
 * @param {string} errorMessage.summaryMessage - Summary error message
 * @param {string} errorMessage.inlineMessage - Inline error message
 * @returns {object} Express-validator custom validator configuration
 */
export function createChangeDetectionValidator(
  fieldMappings: Array<{ current: string; original: string }>,
  errorMessage: { summaryMessage: string | (() => string); inlineMessage: string | (() => string) }
): {
  in: Location[];
  custom: {
    options: (_value: string, meta: Meta) => boolean;
    errorMessage: () => TypedValidationError;
  };
} {
  return {
    in: ['body'] as Location[],
    custom: {
      /**
       * Schema to check if any of the specified field values have been unchanged.
       * @param {string} _value - Placeholder value (unused)
       * @param {Meta} meta - `express-validator` context containing request object
       * @returns {boolean} True if any field has changed
       */
      options: (_value: string, meta: Meta): boolean => {
        const { req } = meta;
        
        if (!isRecord(req.body)) {
          return true;
        }

        // Check if any field has changed using type-safe property access
        const hasChanges = fieldMappings.some(({ current, original }) => {
          const currentRaw = hasProperty(req.body, current) ? req.body[current] : '';
          const originalRaw = hasProperty(req.body, original) ? req.body[original] : '';
          
          // Normalize boolean/checkbox values for comparison
          // Checkboxes: unchecked = "" or missing, checked = "on" or "true" 
          // Stored values: "false" or "true" strings
          /**
           * Normalize boolean/checkbox values for consistent comparison between form data and stored values
           * @param {string} value - The input value to normalize
           * @returns {string} Normalized value as "true" or "false" string
           */
          const normalizeBooleanValue = (value: string): string => {
            const stringValue = safeString(value).trim().toLowerCase();
            // Treat empty string, "false", and "off" as falsy (unchecked)
            if (stringValue === '' || stringValue === 'false' || stringValue === 'off') {
              return 'false';
            }
            // Treat "on", "true", "1" as truthy (checked)
            if (stringValue === 'on' || stringValue === 'true' || stringValue === '1') {
              return 'true';
            }
            // For non-boolean fields, return the trimmed value as-is
            return stringValue;
          };
          
          const currentValue = normalizeBooleanValue(safeString(currentRaw));
          const originalValue = normalizeBooleanValue(safeString(originalRaw));
          const hasChanged = currentValue !== originalValue;
          
          return hasChanged;
        });
        
        return hasChanges;
      },
      /**
       * Custom error message for when no changes are made
       * @returns {TypedValidationError} Returns TypedValidationError with structured error data
       */
      errorMessage: () => {
        /**
         * Resolve possibly lazy string value.
         * @param {string | (() => string)} val - Value or thunk
         * @returns {string} Resolved string
         */
        const resolve = (val: string | (() => string)): string => typeof val === 'function' ? val() : val;
        let summaryMessage = resolve(errorMessage.summaryMessage);
        let inlineMessage = resolve(errorMessage.inlineMessage);

        /**
         * Translate message if it appears to be a dotted key and translation exists.
         * @param {string} msg - Original or key-like message
         * @returns {string} Possibly translated message
         */
        const translateIfKey = (msg: string): string => {
          if (!i18next.isInitialized) return msg;
          if (!msg.includes('.')) return msg;
          const translated = i18next.t(msg);
          return translated !== '' && translated !== msg ? translated : msg;
        };

        summaryMessage = translateIfKey(summaryMessage);
        if (inlineMessage !== '') {
          inlineMessage = translateIfKey(inlineMessage);
        }

        return new TypedValidationError({ summaryMessage, inlineMessage });
      }
    }
  };
}

/**
 * Creates a session-based change detection validator that compares current form fields against session data
 * @param {string[]} fieldNames - Array of field names to compare against session data
 * @param {string} sessionNamespace - Session namespace where original data is stored
 * @param {object} errorMessage - Error message to show when no changes detected
 * @param {string} errorMessage.summaryMessage - Summary error message
 * @param {string} errorMessage.inlineMessage - Inline error message
 * @returns {object} Express-validator custom validator configuration
 */
export function createSessionChangeDetectionValidator(
  fieldNames: string[],
  sessionNamespace: string,
  errorMessage: { summaryMessage: string | (() => string); inlineMessage: string | (() => string) }
): {
  in: Location[];
  custom: {
    options: (_value: string, meta: Meta) => boolean;
    errorMessage: () => TypedValidationError;
  };
} {
  return {
    in: ['body'] as Location[],
    custom: {
      /**
       * Schema to check if any of the specified field values have changed from session data.
       * @param {string} _value - Placeholder value (unused)
       * @param {Meta} meta - `express-validator` context containing request object
       * @returns {boolean} True if any field has changed
       */
      options: (_value: string, meta: Meta): boolean => {
        const { req } = meta;
        if (!isRecord(req.body)) {
          return true;
        }

        // Type-safe session access - check if session exists
        if (!hasProperty(req, 'session') || !isRecord(req.session)) {
          return true;
        }

        const { session } = req;
        
        if (!hasProperty(session, sessionNamespace)) {
          // If no session data, allow submission (edge case handling)
          return true;
        }

        const { [sessionNamespace]: originalDataRaw } = session;
        
        if (!isRecord(originalDataRaw)) {
          return true;
        }

        // Check if any field has changed compared to session data
        return fieldNames.some((fieldName) => {
          const currentRaw = hasProperty(req.body, fieldName) ? req.body[fieldName] : '';
          const currentValue = safeString(currentRaw).trim();
          
          // Safely get original value from session data
          const originalRaw = hasProperty(originalDataRaw, fieldName) ? originalDataRaw[fieldName] : '';
          const originalValue = safeString(originalRaw).trim();
          
          return currentValue !== originalValue;
        });
      },
      /**
       * Custom error message for when no changes are made
       * @returns {TypedValidationError} Returns TypedValidationError with structured error data
       */
      errorMessage: () => {
        /**
         * Resolve possibly lazy string value.
         * @param {string | (() => string)} val - Value or thunk
         * @returns {string} Resolved string
         */
        const resolve = (val: string | (() => string)): string => typeof val === 'function' ? val() : val;
        let summaryMessage = resolve(errorMessage.summaryMessage);
        let inlineMessage = resolve(errorMessage.inlineMessage);

        /**
         * Translate message if it appears to be a dotted key and translation exists.
         * @param {string} msg - Original or key-like message
         * @returns {string} Possibly translated message
         */
        const translateIfKey = (msg: string): string => {
          if (!i18next.isInitialized) return msg;
          if (!msg.includes('.')) return msg;
          const translated = i18next.t(msg);
          return translated !== '' && translated !== msg ? translated : msg;
        };

        summaryMessage = translateIfKey(summaryMessage);
        if (inlineMessage !== '') {
          inlineMessage = translateIfKey(inlineMessage);
        }

        return new TypedValidationError({ summaryMessage, inlineMessage });
      }
    }
  };
}

/**
 * Handles validation errors by rendering the form with error messages
 * @param {Result<ValidationErrorData>} validationErrors - Validation errors from express-validator
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {string} caseReference - Case reference number
 */
export function handleValidationErrors(
  validationErrors: Result<ValidationErrorData>,
  req: Request,
  res: Response,
  caseReference: string
): void {
  const BAD_REQUEST = 400;

  // Map validation errors to field names following phone number pattern
  const resultingErrors = validationErrors.array().map((errorData: ValidationErrorData) => {
    // Determine field name based on the validation error
    let fieldName = 'address'; // default

    if (errorData.summaryMessage.toLowerCase().includes('postcode')) {
      fieldName = 'postcode';
    } else if (errorData.summaryMessage.toLowerCase().includes('update the client address')) {
      // Change detection error - no specific field
      fieldName = 'address'; // Default to address for summary href
    }

    return {
      fieldName,
      inlineMessage: errorData.inlineMessage,
      summaryMessage: errorData.summaryMessage,
    };
  });

  // Build input errors object for individual field error messages
  // Only use inline messages that are not empty
  const inputErrors = resultingErrors.reduce<Record<string, string>>((acc, { fieldName, inlineMessage }) => {
    if (inlineMessage.trim() !== '') {
      acc[fieldName] = inlineMessage;
    }
    return acc;
  }, {});

  // Build error summary list for the error summary component
  const errorSummaryList = resultingErrors.map(({ summaryMessage, fieldName }) => ({
    text: summaryMessage,
    href: `#${fieldName}`,
  }));

  // Re-render the form with errors and preserve user input
  res.status(BAD_REQUEST).render('case_details/change-client-address.njk', {
    caseReference,
    currentAddress: hasProperty(req.body, 'address') ? safeString(req.body.address) : '',
    currentPostcode: hasProperty(req.body, 'postcode') ? safeString(req.body.postcode) : '',
    existingAddress: hasProperty(req.body, 'existingAddress') ? safeString(req.body.existingAddress) : '',
    existingPostcode: hasProperty(req.body, 'existingPostcode') ? safeString(req.body.existingPostcode) : '',
    error: {
      inputErrors,
      errorSummaryList
    },
    csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined,
  });
}
