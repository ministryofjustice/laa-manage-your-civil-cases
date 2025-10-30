
import { checkSchema, type Meta } from 'express-validator';
import { isDate, isBefore } from 'validator';
import { hasProperty, isRecord, createChangeDetectionValidator, TypedValidationError, dateStringFromThreeFields, t } from '#src/scripts/helpers/index.js';

// Constants for validation boundaries
const MIN_DAY = 1;
const MAX_DAY = 31;
const MIN_MONTH = 1;
const MAX_MONTH = 12;
const YEAR_LENGTH = 4;
const DATE_OFFSET = 1;
const DATE_IN_DISTANT_PAST = 1901

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
          summaryMessage: t('forms.clientDetails.dateOfBirth.validationError.day.notEmpty'),
          inlineMessage: t('forms.clientDetails.dateOfBirth.validationError.day.notEmpty'),
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
          summaryMessage: t('forms.clientDetails.dateOfBirth.validationError.day.isInt'),
          inlineMessage: t('forms.clientDetails.dateOfBirth.validationError.day.isInt'),
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
          summaryMessage: t('forms.clientDetails.dateOfBirth.validationError.month.notEmpty'),
          inlineMessage: t('forms.clientDetails.dateOfBirth.validationError.month.notEmpty'),
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
          summaryMessage: t('forms.clientDetails.dateOfBirth.validationError.month.isInt'),
          inlineMessage: t('forms.clientDetails.dateOfBirth.validationError.month.isInt'),
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
          summaryMessage: t('forms.clientDetails.dateOfBirth.validationError.year.notEmpty'),
          inlineMessage: t('forms.clientDetails.dateOfBirth.validationError.year.notEmpty'),
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
          summaryMessage: t('forms.clientDetails.dateOfBirth.validationError.year.isLength'),
          inlineMessage: t('forms.clientDetails.dateOfBirth.validationError.year.isLength'),
        }),
        bail: true, // Stop further year validation if format is wrong
      },
      isInt: {
        /**
         * Validates that the year is a valid integer
         * @returns {TypedValidationError} Error for invalid year
         */
        options: { min: DATE_IN_DISTANT_PAST },
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.clientDetails.dateOfBirth.validationError.year.isInt'),
          inlineMessage: t('forms.clientDetails.dateOfBirth.validationError.year.isInt'),
        })
      },
    },
    validDate: {
      in: ['body'],
      custom: {
        /**
         * Schema to check if the day/month/year combination forms a valid date.
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
         * Custom error message for invalid date combinations
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.clientDetails.dateOfBirth.validationError.validDate'),
          inlineMessage: t('forms.clientDetails.dateOfBirth.validationError.validDate'),
        }),
        bail: true, // Stop validation if date format is invalid
      },
    },
    dateInPast: {
      in: ['body'],
      custom: {
        /**
         * Validates that the complete date is in the past - only runs if validDate passes
         * @param {string} _value - Placeholder value (unused)
         * @param {Meta} meta - `express-validator` context containing request object
         * @returns {boolean} True if the date is in the past or equal to today
         */
        options: (_value: string, meta: Meta): boolean => {
          const { req } = meta;

          if (!isClientDateOfBirthBody(req.body)) {
            return true;
          }

          const day = req.body['dateOfBirth-day'].trim();
          const month = req.body['dateOfBirth-month'].trim();
          const year = req.body['dateOfBirth-year'].trim();

          // At this point, we know the date is valid due to upstream validations
          const dateString = dateStringFromThreeFields(day, month, year);

          // Use validator's isBefore function to check if date is before or equal to today
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + DATE_OFFSET);
          const [tomorrowString] = tomorrow.toISOString().split('T'); // YYYY-MM-DD format
          return isBefore(dateString, tomorrowString);
        },
        /**
         * Error message for dates not in the past
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.clientDetails.dateOfBirth.validationError.dateInPast'),
          inlineMessage: t('forms.clientDetails.dateOfBirth.validationError.dateInPast'),
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
        /**
         * Provides the summary message for unchanged date of birth validation.
         * @returns {string} Localized error message for unchanged date of birth.
         */
        summaryMessage: () => t('forms.clientDetails.dateOfBirth.validationError.notChanged'),
        inlineMessage: ''
      }
    ),
  });
