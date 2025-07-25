import express from 'express';
import { getEditClientName, postEditClientName } from '#src/scripts/controllers/editClientDetailsController.js';

const router = express.Router();

router.get('/:caseReference/client-details/edit/name', getEditClientName);
router.post('/:caseReference/client-details/edit/name', postEditClientName);

export default router;
