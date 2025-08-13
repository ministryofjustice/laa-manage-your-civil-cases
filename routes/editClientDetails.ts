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

const router = express.Router();

router.get('/:caseReference/client-details/change/name', getEditClientName);
router.post('/:caseReference/client-details/change/name', postEditClientName);

router.get('/:caseReference/client-details/change/email-address', getEditClientEmailAddress);
router.post('/:caseReference/client-details/change/email-address', postEditClientEmailAddress);

router.get('/:caseReference/client-details/change/phone-number', getEditClientPhoneNumber);
router.post('/:caseReference/client-details/change/phone-number', validateEditClientPhoneNumber(), postEditClientPhoneNumber);

export default router;
