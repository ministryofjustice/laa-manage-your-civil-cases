import express from 'express';
import { 
  getEditClientName, 
  postEditClientName, 
  getEditClientEmailAddress, 
  postEditClientEmailAddress,
  getEditClientPhoneNumber,
  postEditClientPhoneNumber
} from '#src/scripts/controllers/editClientDetailsController.js';
import { validateEditClientPhoneNumber } from '#src/middlewares/phoneNumberSchema.js';
import { getEditDateOfBirth, postEditDateOfBirth } from '#src/scripts/controllers/editDateOfBirthController.js';
import { customExpressValidator, dateOfBirthSchema } from '#src/validation/index.js';

const router = express.Router();

router.get('/:caseReference/client-details/edit/name', getEditClientName);
router.post('/:caseReference/client-details/edit/name', postEditClientName);

router.get('/:caseReference/client-details/edit/email-address', getEditClientEmailAddress);
router.post('/:caseReference/client-details/edit/email-address', postEditClientEmailAddress);

router.get('/:caseReference/client-details/edit/phone-number', getEditClientPhoneNumber);
router.post('/:caseReference/client-details/edit/phone-number', validateEditClientPhoneNumber(), postEditClientPhoneNumber);

router.get('/:caseReference/client-details/edit/date-of-birth', getEditDateOfBirth);
router.post('/:caseReference/client-details/edit/date-of-birth', customExpressValidator.checkSchema(dateOfBirthSchema), postEditDateOfBirth);

export default router;
