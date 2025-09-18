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
  postEditClientAddress,
  getAddClientThirdParty,
  postAddClientThirdParty,
  getEditClientThirdParty,
  postEditClientThirdParty
} from '#src/scripts/controllers/index.js';

import {
  validateEditClientName,
  validateEditClientDateOfBirth,
  validateEditClientPhoneNumber,
  validateEditClientEmailAddress,
  validateEditClientAddress,
  validateAddClientThirdParty,
  validateEditClientThirdParty
} from '#src/middlewares/index.js';

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

router.get('/:caseReference/client-details/add/third-party', getAddClientThirdParty);
router.post('/:caseReference/client-details/add/third-party', validateAddClientThirdParty(), postAddClientThirdParty);

router.get('/:caseReference/client-details/change/third-party', getEditClientThirdParty);
router.post('/:caseReference/client-details/change/third-party', validateEditClientThirdParty(), postEditClientThirdParty);

export default router;
