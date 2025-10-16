import { checkSchema } from 'express-validator';
import { TypedValidationError, t } from '#src/scripts/helpers/index.js';

/**
 * Validation middleware for login form input.
 * @returns {Error} Validation schema for express-validator
 */
export const validateLoginDetails = (): ReturnType<typeof checkSchema> =>
  checkSchema({
    searchKeyword: {
      in: ['body'],
      trim: true,
      notEmpty: {
        /**
         * Custom error message for empty search keyword
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.search.validationError.notEmpty'),
          inlineMessage: t('forms.search.validationError.notEmpty')
        })
      }
    }
  });

// /**
//  * Validate and extract credentials from request body
//  * @param {unknown} body Request body to validate
//  * @returns {{ valid: false; error: string } | { valid: true; username: string; password: string }} Validation result
//  */
// function extractCredentials(body: unknown): { valid: false; error: string } | { valid: true; username: string; password: string } {
//   // Use existing helper to check if body is a valid object
//   if (!hasProperty(body, 'username') || !hasProperty(body, 'password')) {
//     return { valid: false, error: 'Invalid request data' };
//   }

//   // Use existing helper to safely extract and convert to string
//   const username = safeString(safeBodyString(body, 'username')).trim();
//   const password = safeString(safeBodyString(body, 'password')).trim();

//   if (username === '') {
//     return { valid: false, error: 'Username is required' };
//   }

//   if (password === '') {
//     return { valid: false, error: 'Password is required' };
//   }

//   return { 
//     valid: true, 
//     username, 
//     password 
//   };
// }