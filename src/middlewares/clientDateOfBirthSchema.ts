import { hasProperty, isRecord } from '#src/scripts/helpers/dataTransformers.js';
import { checkSchema, type Meta } from 'express-validator';
import { TypedValidationError } from '#src/scripts/helpers/ValidationErrorHelpers.js';

interface ClientDateOfBirthBody {
  'dateOfBirth-day': string;
  'dateOfBirth-month': string;
  'dateOfBirth-year': string;
  originalDay: string;
  originalMonth: string;
  originalYear: string;
}

/**
 * Checks whether the given body object has the expected structure of ClientDateOfBirthBody.
 * @param {unknown} body - The body object to check
 * @returns {body is ClientDateOfBirthBody} True if the body matches ClientDateOfBirthBody shape
 */
function isClientDateOfBirthBody(body: unknown): body is ClientDateOfBirthBody {
  return isRecord(body) &&
    hasProperty(body, 'dateOfBirth-day') &&
    hasProperty(body, 'dateOfBirth-month') &&
    hasProperty(body, 'dateOfBirth-year') &&
    hasProperty(body, 'originalDay') &&
    hasProperty(body, 'originalMonth') &&
    hasProperty(body, 'originalYear');
}

/**
 * Validation middleware when user edits client's date of birth.
 * Validates day, month, year fields with date validation and change detection.
 * @returns {Error} Validation schema for express-validator
 */
export const validateEditClientDateOfBirth = (): ReturnType<typeof checkSchema> =>
  checkSchema({
    'dateOfBirth-day': {
      in: ['body'],
      trim: true,
      notEmpty: {
        errorMessage: () => new TypedValidationError({
          summaryMessage: 'Enter a day',
          inlineMessage: 'Enter a day',
        })
      },
      isInt: {
        options: { min: 1, max: 31 },
        if: (value: any) => value !== '', // Only validate format if not empty
        errorMessage: () => new TypedValidationError({
          summaryMessage: 'Day must be between 1 and 31',
          inlineMessage: 'Day must be between 1 and 31',
        })
      },
    },
    'dateOfBirth-month': {
      in: ['body'],
      trim: true,
      notEmpty: {
        errorMessage: () => new TypedValidationError({
          summaryMessage: 'Enter a month',
          inlineMessage: 'Enter a month',
        })
      },
      isInt: {
        options: { min: 1, max: 12 },
        if: (value: any) => value !== '', // Only validate format if not empty
        errorMessage: () => new TypedValidationError({
          summaryMessage: 'Month must be between 1 and 12',
          inlineMessage: 'Month must be between 1 and 12',
        })
      },
    },
    'dateOfBirth-year': {
      in: ['body'],
      trim: true,
      notEmpty: {
        errorMessage: () => new TypedValidationError({
          summaryMessage: 'Enter a year',
          inlineMessage: 'Enter a year',
        })
      },
      isInt: {
        options: { min: 1, max: new Date().getFullYear() },
        if: (value: any) => value !== '', // Only validate format if not empty
        errorMessage: () => new TypedValidationError({
          summaryMessage: `Year must be ${new Date().getFullYear()} or earlier`,
          inlineMessage: `Year must be ${new Date().getFullYear()} or earlier`,
        })
      },
    },
    notChanged: {
      in: ['body'],
      custom: {
        /**
         * Schema to check if the date of birth values have been unchanged (AC5).
         * @param {string} _value - Placeholder value (unused)
         * @param {Meta} meta - `express-validator` context containing request object
         * @returns {boolean} True if date of birth has changed
         */
        options: (_value: string, meta: Meta): boolean => {
          const { req } = meta;
          if (!isClientDateOfBirthBody(req.body)) {
            return true;
          }
          
          const dayChanged = req.body['dateOfBirth-day'].trim() !== req.body.originalDay.trim();
          const monthChanged = req.body['dateOfBirth-month'].trim() !== req.body.originalMonth.trim();
          const yearChanged = req.body['dateOfBirth-year'].trim() !== req.body.originalYear.trim();
          
          return dayChanged || monthChanged || yearChanged;
        },
        /**
         * Custom error message for when no changes are made (AC5)
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: 'Update the client date of birth or select \'Cancel\'',
          inlineMessage: '',
        })
      },
    },
  });
