import { hasProperty, isRecord } from '#src/scripts/helpers/dataTransformers.js';
import { createChangeDetectionValidator, TypedValidationError } from '#src/scripts/helpers/ValidationErrorHelpers.js';
import { checkSchema, type Meta } from 'express-validator';
import { dateStringFromThreeFields } from '#src/scripts/helpers/dateFormatter.js';
import { isDate, isBefore } from 'validator';

// Constants for validation boundaries
const MIN_DAY = 1;
const MAX_DAY = 31;
const MIN_MONTH = 1;
const MAX_MONTH = 12;
const YEAR_LENGTH = 4;

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
        /**
         * Validates that the day field is not empty
         * @returns {TypedValidationError} Error for missing day
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: 'The date of birth must include a day',
          inlineMessage: 'The date of birth must include a day',
        }),
        bail: true, // Stop this field's validation if day is missing
      },
      isInt: {
        options: { min: MIN_DAY, max: MAX_DAY },
        /**
         * Validates that the day is a valid integer between 1 and 31
         * @returns {TypedValidationError} Error for invalid day range
         */
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
        /**
         * Validates that the month field is not empty
         * @returns {TypedValidationError} Error for missing month
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: 'The date of birth must include a month',
          inlineMessage: 'The date of birth must include a month',
        }),
        bail: true, // Stop this field's validation if month is missing
      },
      isInt: {
        options: { min: MIN_MONTH, max: MAX_MONTH },
        /**
         * Validates that the month is a valid integer between 1 and 12
         * @returns {TypedValidationError} Error for invalid month range
         */
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
        /**
         * Validates that the year field is not empty
         * @returns {TypedValidationError} Error for missing year
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: 'The date of birth must include a year',
          inlineMessage: 'The date of birth must include a year',
        }),
        bail: true, // Stop this field's validation if year is missing
      },
      isLength: {
        options: { min: YEAR_LENGTH, max: YEAR_LENGTH },
        /**
         * Validates that the year is exactly 4 digits long
         * @returns {TypedValidationError} Error for invalid year length
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: 'Year must include 4 numbers',
          inlineMessage: 'Year must include 4 numbers',
        }),
        bail: true, // Stop further year validation if format is wrong
      },
      isInt: {
        /**
         * Validates that the year is a valid integer
         * @returns {TypedValidationError} Error for invalid year
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: 'Year must be a valid number',
          inlineMessage: 'Year must be a valid number',
        })
      },
    },
    validDate: {
      in: ['body'],
      custom: {
        /**
         * Schema to check if the day/month/year combination forms a valid date (AC8).
         * @param {string} _value - Placeholder value (unused)
         * @param {Meta} meta - `express-validator` context containing request object
         * @returns {boolean} True if the date combination is valid
         */
        options: (_value: string, meta: Meta): boolean => {
          const { req } = meta;
          
          if (!isClientDateOfBirthBody(req.body)) {
            return true;
          }

          const day = req.body['dateOfBirth-day'].trim();
          const month = req.body['dateOfBirth-month'].trim();
          const year = req.body['dateOfBirth-year'].trim();

          // Use validator.js isDate() with dateStringFromThreeFields helper
          const dateString = dateStringFromThreeFields(day, month, year);
          
          return isDate(dateString);
        },
        /**
         * Custom error message for invalid date combinations (AC8)
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: 'Enter a date in the correct format',
          inlineMessage: 'Enter a date in the correct format',
        })
      },
    },
    dateInPast: {
      in: ['body'],
      custom: {
        /**
         * Validates that the complete date is in the past using validator's before function
         * @param {string} _value - Placeholder value (unused)
         * @param {Meta} meta - `express-validator` context containing request object
         * @returns {boolean} True if the date is in the past
         */
        options: (_value: string, meta: Meta): boolean => {
          const { req } = meta;
          const day = req.body['dateOfBirth-day'].trim();
          const month = req.body['dateOfBirth-month'].trim();
          const year = req.body['dateOfBirth-year'].trim();

          // First check if it's a valid date
          const dateString = dateStringFromThreeFields(day, month, year);
   
          // Use validator's isBefore function to check if date is before or equal to today
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowString = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format
          return isBefore(dateString, tomorrowString);
        },
        /**
         * Error message for dates not in the past
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: 'The date of birth must be in the past',
          inlineMessage: 'The date of birth must be in the past',
        })
      },
    },
    notChanged: createChangeDetectionValidator(
      [
        { current: 'dateOfBirth-day', original: 'originalDay' },
        { current: 'dateOfBirth-month', original: 'originalMonth' },
        { current: 'dateOfBirth-year', original: 'originalYear' }
      ],
      {
        summaryMessage: "Update the client date of birth or select 'Cancel'",
        inlineMessage: ''
      }
    ),
  });
