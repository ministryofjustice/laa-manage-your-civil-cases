import { 
  ExpressValidator, 
  type CustomValidationChain as BaseCustomValidationChain, 
  type CustomSchema as BaseCustomSchema 
} from 'express-validator';
import { govUkErrorFormatter } from './errorFormatters/govUkErrorFormatter.js';

/**
 * @file Custom ExpressValidator instance for LAA application
 * 
 * This module provides a centralized ExpressValidator instance with:
 * - Custom validators specific to the LAA application domain
 * - GOV.UK Design System compatible error formatting
 * - Enhanced TypeScript support with custom validation types
 * - Consistent error handling across all validation scenarios
 * 
 * @version 1.0.0
 * @since 2025-08-04
 */

/**
 * Custom ExpressValidator instance with GOV.UK formatting
 * 
 * This instance provides enhanced validation capabilities specifically designed
 * for the LAA Manage Your Civil Cases application, including:
 * 
 * **Features:**
 * - Automatic GOV.UK Design System error formatting
 * - Enhanced TypeScript support with full type safety
 * - Message-based priority mapping for validation errors
 * - Centralized error formatting for improved maintainability
 * - Performance optimized with single formatter instance
 * 
 * **Usage:**
 * ```typescript
 * import { customExpressValidator, dateOfBirthSchema } from './validation/index.js';
 * const { checkSchema } = customExpressValidator;
 * 
 * // Use direct schema with custom validator functions
 * app.post('/form', checkSchema(dateOfBirthSchema), (req, res) => {
 *   // Handle validated form data
 * });
 * ```
 * 
 * @example
 * // Using in middleware with direct schema validation
 * export const validation = checkSchema(dateOfBirthSchema);
 */
export const customExpressValidator = new ExpressValidator(
  {
    // Future validators can be added here as needed:
    // isValidEmail: validateEmail,
    // isValidName: validateName,
    // isValidPostcode: validatePostcode,
  },
  {
    // Custom sanitizers can be added here in the future
    // removeExtraSpaces: (value) => value.replace(/\s+/g, ' ').trim(),
  },
  {
    /**
     * GOV.UK Error Formatter - preserves custom properties during validation
     * 
     * This formatter ensures that custom properties (priority, isGlobal, code)
     * are preserved when express-validator processes validation results.
     * Replaces the previous pass-through formatter with proper GOV.UK formatting.
     * 
     * @see {@link govUkErrorFormatter} for implementation details
     */
    errorFormatter: govUkErrorFormatter
  }
);

/**
 * Exported validation functions with enhanced TypeScript support
 * 
 * These functions provide the same functionality as express-validator's
 * built-in functions but with our custom validators and error formatting
 * pre-configured.
 * 
 * @namespace ValidationFunctions
 */

/**
 * Create validation chains for request body fields
 * @memberof ValidationFunctions
 * @function body
 * @see {@link https://express-validator.github.io/docs/api/check/#body|Express-validator body documentation}
 */

/**
 * Create validation schema for multiple fields
 * @memberof ValidationFunctions  
 * @function checkSchema
 * @see {@link https://express-validator.github.io/docs/api/schema/#checkschema|Express-validator checkSchema documentation}
 */

/**
 * Extract validation results from request with custom formatting
 * @memberof ValidationFunctions
 * @function validationResult
 * @see {@link https://express-validator.github.io/docs/api/validation-result/#validationresult|Express-validator validationResult documentation}
 */

/**
 * General field validation function
 * @memberof ValidationFunctions
 * @function check
 */

/**
 * Validate URL parameters
 * @memberof ValidationFunctions
 * @function param
 */

/**
 * Validate query string parameters
 * @memberof ValidationFunctions
 * @function query
 */

/**
 * Validate HTTP headers
 * @memberof ValidationFunctions
 * @function header
 */

/**
 * Validate HTTP cookies
 * @memberof ValidationFunctions
 * @function cookie
 */
export const { 
  body, 
  checkSchema, 
  validationResult, 
  check,
  param,
  query,
  header,
  cookie
} = customExpressValidator;

/**
 * Export custom types for TypeScript support
 * 
 * These types provide full type safety when using the custom validator
 * in schemas and validation chains.
 */
export type CustomValidationChain = BaseCustomValidationChain<typeof customExpressValidator>;
export type CustomSchema = BaseCustomSchema<typeof customExpressValidator>;

/**
 * Helper function to create a typed validation chain
 * 
 * @param {string} field - The field name to validate
 * @returns {CustomValidationChain} A typed validation chain for the field
 * @example
 * ```typescript
 * const emailChain = createValidationChain('email')
 *   .isEmail()
 *   .isValidEmail(); // Custom validator with full type support
 * ```
 */
export function createValidationChain(field: string): CustomValidationChain {
  return body(field);
}

/**
 * Helper function to create a typed schema
 * 
 * @param {CustomSchema} schema - The validation schema object
 * @returns {CustomSchema} The validated schema with type safety
 * @example
 * ```typescript
 * const schema = createValidationSchema(dateOfBirthSchema);
 * app.post('/date', checkSchema(schema), controller);
 * ```
 */
export function createValidationSchema(schema: CustomSchema): CustomSchema {
  return schema;
}

/**
 * Note: Old error formatter removed - errors are now template-ready from validators
 */
