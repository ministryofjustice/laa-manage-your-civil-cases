import { hasProperty, isRecord } from '#src/scripts/helpers/dataTransformers.js';
import { checkSchema, type Meta } from 'express-validator';
import { TypedValidationError } from '#src/scripts/helpers/ValidationErrorHelpers.js';
import { isDate, isBefore } from 'validator';

// Constants for validation boundaries
const MIN_DAY = 1;
const MAX_DAY = 31;
const MIN_MONTH = 1;
const MAX_MONTH = 12;
const YEAR_LENGTH = 4;
const MIN_YEAR = 1;
const DATE_PADDING_WIDTH = 2;
const DATE_PADDING_CHAR = '0';
const NEXT_DAY_OFFSET = 1;

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
        })
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
        })
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
        })
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
        })
      },
      isInt: {
        options: { min: MIN_YEAR, max: new Date().getFullYear() },
        /**
         * Validates that the year is not in the future
         * @returns {TypedValidationError} Error for future year
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: 'The date of birth must be in the past',
          inlineMessage: 'The date of birth must be in the past',
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

          // Use validator.js isDate() instead of custom date validation
          const paddedMonth = month.padStart(DATE_PADDING_WIDTH, DATE_PADDING_CHAR);
          const paddedDay = day.padStart(DATE_PADDING_WIDTH, DATE_PADDING_CHAR);
          const dateString = `${year}-${paddedMonth}-${paddedDay}`;
          
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
    notFutureDate: {
      in: ['body'],
      custom: {
        /**
         * Schema to check if the date is not in the future (AC7).
         * @param {string} _value - Placeholder value (unused)
         * @param {Meta} meta - `express-validator` context containing request object
         * @returns {boolean} True if the date is in the past
         */
        options: (_value: string, meta: Meta): boolean => {
          const { req } = meta;
          if (!isClientDateOfBirthBody(req.body)) {
            return true;
          }

          const day = req.body['dateOfBirth-day'].trim();
          const month = req.body['dateOfBirth-month'].trim();
          const year = req.body['dateOfBirth-year'].trim();

          // Use validator.js isBefore() for future date validation
          const paddedMonth = month.padStart(DATE_PADDING_WIDTH, DATE_PADDING_CHAR);
          const paddedDay = day.padStart(DATE_PADDING_WIDTH, DATE_PADDING_CHAR);
          const inputDateString = `${year}-${paddedMonth}-${paddedDay}`;
          
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + NEXT_DAY_OFFSET);
          const [tomorrowString] = tomorrow.toISOString().split('T');
          
          return isBefore(inputDateString, tomorrowString);
        },
        /**
         * Custom error message for future dates (AC7)
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: 'Date of birth must be in the past',
          inlineMessage: 'Date of birth must be in the past',
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
