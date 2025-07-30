import express from 'express';
import { getEditClientName, postEditClientName, getEditClientEmailAddress, postEditClientEmailAddress } from '#src/scripts/controllers/editClientDetailsController.js';

const router = express.Router();

router.get('/:caseReference/client-details/edit/name', getEditClientName);
router.post('/:caseReference/client-details/edit/name', postEditClientName);

router.get('/:caseReference/client-details/edit/email-address', getEditClientEmailAddress);
router.post('/:caseReference/client-details/edit/email-address', postEditClientEmailAddress);

export default router;
