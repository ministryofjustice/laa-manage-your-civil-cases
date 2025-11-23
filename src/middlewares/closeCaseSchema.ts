import { body, ValidationChain } from 'express-validator';

const MAX_CLOSE_NOTE_LENGTH = 5000;

/**
 * Validation schema for closing a case
 * @returns {ValidationChain[]} Array of validation chains
 */
export function validateCloseCase(): ValidationChain[] {
  return [
    body('eventCode')
      .trim()
      .notEmpty()
      .withMessage('Select why this case is closed'),
    
    body('closeNote')
      .optional({ values: 'falsy' })
      .trim()
      .isLength({ max: MAX_CLOSE_NOTE_LENGTH })
      .withMessage(`Note must be ${MAX_CLOSE_NOTE_LENGTH} characters or fewer`)
  ];
}

export { MAX_CLOSE_NOTE_LENGTH };
