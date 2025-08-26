import express from 'express';
import {
  getEditClientName,
  postEditClientName,
  getEditClientDateOfBirth,
  postEditClientDateOfBirth,
  getEditClientPhoneNumber,
  postEditClientPhoneNumber,
  getEditClientEmailAddress,
  postEditClientEmailAddress,
  getEditClientAddress,
  postEditClientAddress
} from '#src/scripts/controllers/index.js';

import { validateEditClientName } from '#src/middlewares/clientNameSchema.js';
import { validateEditClientDateOfBirth } from '#src/middlewares/clientDateOfBirthSchema.js';
import { validateEditClientPhoneNumber } from '#src/middlewares/clientPhoneNumberSchema.js';
import { validateEditClientEmailAddress } from '#src/middlewares/clientEmailAddressSchema.js';
import { validateEditClientAddress } from '#src/middlewares/clientAddressSchema.js';

const router = express.Router();

router.get('/:caseReference/client-details/change/name', getEditClientName);
router.post('/:caseReference/client-details/change/name', validateEditClientName(), postEditClientName);

router.get('/:caseReference/client-details/change/date-of-birth', getEditClientDateOfBirth);
router.post('/:caseReference/client-details/change/date-of-birth', validateEditClientDateOfBirth(), postEditClientDateOfBirth);

router.get('/:caseReference/client-details/change/phone-number', getEditClientPhoneNumber);
router.post('/:caseReference/client-details/change/phone-number', validateEditClientPhoneNumber(), postEditClientPhoneNumber);

router.get('/:caseReference/client-details/change/email-address', getEditClientEmailAddress);
router.post('/:caseReference/client-details/change/email-address', validateEditClientEmailAddress(), postEditClientEmailAddress);

router.get('/:caseReference/client-details/change/address', getEditClientAddress);
router.post('/:caseReference/client-details/change/address', validateEditClientAddress(), postEditClientAddress);


export default router;
