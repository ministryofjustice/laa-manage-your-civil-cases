import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import type { ExpressJoiError } from 'express-joi-validation';
import { Result } from 'express-validator';
import {
  getEditClientName,
  postEditClientName,
  getEditClientEmailAddress,
  postEditClientEmailAddress,
  getEditClientPhoneNumber,
  postEditClientPhoneNumber
} from '#src/scripts/controllers/editClientDetailsController.js';
import { getEditClientAddress, postEditClientAddress } from '#src/scripts/controllers/editClientAddressController.js';
import { 
  getEditClientDateOfBirth, 
  postEditClientDateOfBirth 
} from '#src/scripts/controllers/editClientDateOfBirthController.js';
import { validateEditClientPhoneNumber } from '#src/middlewares/phoneNumberSchema.js';
import { validateEditClientAddress } from '#src/middlewares/clientAddressSchema.js';
import { validateEditClientDateOfBirth } from '#src/middlewares/clientDateOfBirthSchema.js';
import { validateEditClientDateOfBirthJoi } from '#src/middlewares/clientDateOfBirthJoiSchema.js';
import { 
  handleDateOfBirthValidationErrors
} from '#src/scripts/helpers/ValidationDateHelpers.js';
import { 
  type ValidationErrorData
} from '#src/scripts/helpers/ValidationErrorHelpers.js';
import { safeString } from '#src/scripts/helpers/index.js';

const router = express.Router();

/**
 * Express error handler for joi validation errors (express-joi-validation)
 * This catches errors from joi validation middleware when passError: true is set
 */
function handleJoiValidationErrors(err: ExpressJoiError, req: Request, res: Response, next: NextFunction): void {
  if (err && err.error && err.error.isJoi) {
    const caseReference = safeString(req.params.caseReference);
    const firstDetail = err.error.details?.[0];
    const message = firstDetail?.message || 'Validation error';
    const priority = firstDetail?.context?.priority || 1;
    
    const errorData: ValidationErrorData = {
      summaryMessage: `${message} (Priority: ${priority})`,
      inlineMessage: ''
    };
    
    const mockResult = {
      isEmpty: () => false,
      array: () => [errorData]
    } as Result<ValidationErrorData>;
    
    handleDateOfBirthValidationErrors(mockResult, req, res, caseReference);
    return;
  }
  
  // If it's not a joi error, pass it to the next error handler
  next(err);
}

router.get('/:caseReference/client-details/change/name', getEditClientName);
router.post('/:caseReference/client-details/change/name', postEditClientName);

router.get('/:caseReference/client-details/change/email-address', getEditClientEmailAddress);
router.post('/:caseReference/client-details/change/email-address', postEditClientEmailAddress);

router.get('/:caseReference/client-details/change/phone-number', getEditClientPhoneNumber);
router.post('/:caseReference/client-details/change/phone-number', validateEditClientPhoneNumber(), postEditClientPhoneNumber);

router.get('/:caseReference/client-details/change/address', getEditClientAddress);
router.post('/:caseReference/client-details/change/address', validateEditClientAddress(), postEditClientAddress);

router.get('/:caseReference/client-details/change/date-of-birth', getEditClientDateOfBirth);
router.post('/:caseReference/client-details/change/date-of-birth', validateEditClientDateOfBirthJoi(), handleJoiValidationErrors, postEditClientDateOfBirth);

export default router;
