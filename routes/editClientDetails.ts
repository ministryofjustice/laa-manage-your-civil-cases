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
  postEditClientThirdParty,
  getAddClientSupportNeeds,
  postAddClientSupportNeeds,
  getEditClientSupportNeeds,
  postEditClientSupportNeeds,
  getEditRiskOfAbuse,
  postEditRiskOfAbuse
} from '#src/scripts/controllers/index.js';

import {
  validateEditClientName,
  validateEditClientDateOfBirth,
  validateEditClientPhoneNumber,
  validateEditClientEmailAddress,
  validateEditClientAddress,
  validateClientThirdParty,
  validateClientSupportNeeds,
  validateClientRiskOfAbuse
} from '#src/middlewares/indexSchema.js';

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
router.post('/:caseReference/client-details/add/third-party', validateClientThirdParty(), postAddClientThirdParty);

router.get('/:caseReference/client-details/change/third-party', getEditClientThirdParty);
router.post('/:caseReference/client-details/change/third-party', validateClientThirdParty(), postEditClientThirdParty);

router.get('/:caseReference/client-details/add/support-need', getAddClientSupportNeeds);
router.post('/:caseReference/client-details/add/support-need', validateClientSupportNeeds(), postAddClientSupportNeeds);

router.get('/:caseReference/client-details/change/support-need', getEditClientSupportNeeds);
router.post('/:caseReference/client-details/change/support-need', validateClientSupportNeeds(), postEditClientSupportNeeds);

router.get('/:caseReference/client-details/change/risk-of-abuse', getEditRiskOfAbuse);
router.post('/:caseReference/client-details/change/risk-of-abuse', validateClientRiskOfAbuse(), postEditRiskOfAbuse);

export default router;
