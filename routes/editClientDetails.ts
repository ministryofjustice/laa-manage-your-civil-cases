import express from 'express';
import { 
  getEditClientName, 
  postEditClientName, 
  getEditClientEmailAddress, 
  postEditClientEmailAddress,
  getEditClientPhoneNumber,
  postEditClientPhoneNumber
} from '#src/scripts/controllers/editClientDetailsController.js';
import { 
  getEditClientDateOfBirth, 
  postEditClientDateOfBirth 
} from '#src/scripts/controllers/editClientDateOfBirthController.js';
import { validateEditClientPhoneNumber } from '#src/middlewares/phoneNumberSchema.js';

const router = express.Router();

router.get('/:caseReference/client-details/edit/name', getEditClientName);
router.post('/:caseReference/client-details/edit/name', postEditClientName);

router.get('/:caseReference/client-details/edit/email-address', getEditClientEmailAddress);
router.post('/:caseReference/client-details/edit/email-address', postEditClientEmailAddress);

router.get('/:caseReference/client-details/edit/phone-number', getEditClientPhoneNumber);
router.post('/:caseReference/client-details/edit/phone-number', validateEditClientPhoneNumber(), postEditClientPhoneNumber);

router.get('/:caseReference/client-details/edit/date-of-birth', getEditClientDateOfBirth);
router.post('/:caseReference/client-details/edit/date-of-birth', postEditClientDateOfBirth);

export default router;
