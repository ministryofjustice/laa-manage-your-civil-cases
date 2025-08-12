import express from 'express';
import { 
  getEditClientName, 
  postEditClientName, 
  getEditClientEmailAddress, 
  postEditClientEmailAddress,
  getEditClientPhoneNumber,
  postEditClientPhoneNumber
} from '#src/scripts/controllers/editClientDetailsController.js';
import { getEditClientAddress, postEditClientAddress } from '#src/scripts/controllers/editClientAddressController.js';
import { validateEditClientPhoneNumber } from '#src/middlewares/phoneNumberSchema.js';
import { validateEditClientAddress } from '#src/middlewares/clientAddressSchema.js';

const router = express.Router();

router.get('/:caseReference/client-details/edit/name', getEditClientName);
router.post('/:caseReference/client-details/edit/name', postEditClientName);

router.get('/:caseReference/client-details/edit/email-address', getEditClientEmailAddress);
router.post('/:caseReference/client-details/edit/email-address', postEditClientEmailAddress);

router.get('/:caseReference/client-details/edit/phone-number', getEditClientPhoneNumber);
router.post('/:caseReference/client-details/edit/phone-number', validateEditClientPhoneNumber(), postEditClientPhoneNumber);

router.get('/:caseReference/client-details/edit/address', getEditClientAddress);
router.post('/:caseReference/client-details/edit/address', validateEditClientAddress(), postEditClientAddress);

export default router;
