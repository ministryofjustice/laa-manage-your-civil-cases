import express from 'express';
import {
  getEditClientName,
  postEditClientName,
  getEditClientEmailAddress,
  postEditClientEmailAddress,
  getEditClientPhoneNumber,
  postEditClientPhoneNumber,
  getStuff,
  getStuffContinues,
  postStuff,
  postStuffContinues
} from '#src/scripts/controllers/editClientDetailsController.js';
import { getEditClientAddress, postEditClientAddress } from '#src/scripts/controllers/editClientAddressController.js';
import { validateEditClientPhoneNumber } from '#src/middlewares/phoneNumberSchema.js';
import { validateEditClientAddress } from '#src/middlewares/clientAddressSchema.js';

const router = express.Router();

router.get('/:caseReference/client-details/change/name', getEditClientName);
router.post('/:caseReference/client-details/change/name', postEditClientName);

router.get('/:caseReference/client-details/change/email-address', getEditClientEmailAddress);
router.post('/:caseReference/client-details/change/email-address', postEditClientEmailAddress);

router.get('/:caseReference/client-details/change/phone-number', getEditClientPhoneNumber);
router.post('/:caseReference/client-details/change/phone-number', validateEditClientPhoneNumber(), postEditClientPhoneNumber);

router.get('/:caseReference/client-details/change/address', getEditClientAddress);
router.post('/:caseReference/client-details/change/address', validateEditClientAddress(), postEditClientAddress);

router.get('/client-details/change/stuff', getStuff);
router.post('/client-details/change/stuff', postStuff);
router.get('/client-details/change/stuff-continues', getStuffContinues);
router.post('/client-details/change/stuff-continues', postStuffContinues);

export default router;
