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
  console.log('DEBUG: Checking body structure:', JSON.stringify(body, null, 2));
  
  const isRecord1 = isRecord(body);
  console.log('DEBUG: isRecord(body):', isRecord1);
  
  if (!isRecord1) return false;
  
  const hasDOBDay = hasProperty(body, 'dateOfBirth-day');
  const hasDOBMonth = hasProperty(body, 'dateOfBirth-month');
  const hasDOBYear = hasProperty(body, 'dateOfBirth-year');
  const hasOrigDay = hasProperty(body, 'originalDay');
  const hasOrigMonth = hasProperty(body, 'originalMonth');
  const hasOrigYear = hasProperty(body, 'originalYear');
  
  console.log('DEBUG: hasDOBDay:', hasDOBDay, 'hasDOBMonth:', hasDOBMonth, 'hasDOBYear:', hasDOBYear);
  console.log('DEBUG: hasOrigDay:', hasOrigDay, 'hasOrigMonth:', hasOrigMonth, 'hasOrigYear:', hasOrigYear);
  
  return hasDOBDay && hasDOBMonth && hasDOBYear && hasOrigDay && hasOrigMonth && hasOrigYear;
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
    },
    'dateOfBirth-month': {
      in: ['body'],
      trim: true,
    },
    'dateOfBirth-year': {
      in: ['body'],
      trim: true,
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
            console.log('DEBUG: Body structure validation failed');
            return true;
          }
          
          console.log('DEBUG: req.body["dateOfBirth-day"]:', req.body['dateOfBirth-day']);
          console.log('DEBUG: req.body["dateOfBirth-month"]:', req.body['dateOfBirth-month']);
          console.log('DEBUG: req.body["dateOfBirth-year"]:', req.body['dateOfBirth-year']);
          console.log('DEBUG: req.body.originalDay:', req.body.originalDay);
          console.log('DEBUG: req.body.originalMonth:', req.body.originalMonth);
          console.log('DEBUG: req.body.originalYear:', req.body.originalYear);
          
          const dayChanged = req.body['dateOfBirth-day'].trim() !== req.body.originalDay.trim();
          const monthChanged = req.body['dateOfBirth-month'].trim() !== req.body.originalMonth.trim();
          const yearChanged = req.body['dateOfBirth-year'].trim() !== req.body.originalYear.trim();
          
          console.log('DEBUG: dayChanged:', dayChanged, `("${req.body['dateOfBirth-day'].trim()}" !== "${req.body.originalDay.trim()}")`);
          console.log('DEBUG: monthChanged:', monthChanged, `("${req.body['dateOfBirth-month'].trim()}" !== "${req.body.originalMonth.trim()}")`);
          console.log('DEBUG: yearChanged:', yearChanged, `("${req.body['dateOfBirth-year'].trim()}" !== "${req.body.originalYear.trim()}")`);
          
          const result = dayChanged || monthChanged || yearChanged;
          console.log('DEBUG: notChanged validation result:', result);
          
          return result;
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
