import { checkSchema } from 'express-validator';
import { createChangeDetectionValidator } from '#src/scripts/helpers/ValidationErrorHelpers.js';

/**
 * Validation middleware when user edits client's contact address.
 * Validates address and postcode fields with postcode uppercase conversion and change detection.
 * @returns {Error} Validation schema for express-validator
 */
export const validateEditClientAddress = (): ReturnType<typeof checkSchema> =>
  checkSchema({
    address: {
      in: ['body'],
      trim: true,
    },
    postcode: {
      in: ['body'],
      trim: true,
    },
    notChanged: createChangeDetectionValidator(
      [
        { current: 'address', original: 'existingAddress' },
        { current: 'postcode', original: 'existingPostcode' }
      ],
      {
        summaryMessage: 'Update the client address, or select \'Cancel\'',
        inlineMessage: ''
      }
    ),
  });
