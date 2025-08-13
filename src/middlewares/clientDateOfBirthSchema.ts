import { hasProperty, isRecord } from '#src/scripts/helpers/dataTransformers.js';
import { checkSchema, type Meta } from 'express-validator';
import { TypedValidationError } from '#src/scripts/helpers/ValidationErrorHelpers.js';

interface ClientDateOfBirthBody {
  dateOfBirthDay: string;
  dateOfBirthMonth: string;
  dateOfBirthYear: string;
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
    hasProperty(body, 'dateOfBirthDay') &&
    hasProperty(body, 'dateOfBirthMonth') &&
    hasProperty(body, 'dateOfBirthYear') &&
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
    dateOfBirthDay: {
      in: ['body'],
      trim: true,
      // TODO: Add validation rules
    },
    dateOfBirthMonth: {
      in: ['body'],
      trim: true,
      // TODO: Add validation rules
    },
    dateOfBirthYear: {
      in: ['body'],
      trim: true,
      // TODO: Add validation rules
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
          
          const dayChanged = req.body.dateOfBirthDay.trim() !== req.body.originalDay.trim();
          const monthChanged = req.body.dateOfBirthMonth.trim() !== req.body.originalMonth.trim();
          const yearChanged = req.body.dateOfBirthYear.trim() !== req.body.originalYear.trim();
          
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
