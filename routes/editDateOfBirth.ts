import express from 'express';
import { getEditDateOfBirth, postEditDateOfBirth } from '#src/scripts/controllers/editDateOfBirthController.js';
import { dateOfBirthValidation } from '#src/middlewares/dateValidation.js';

const router = express.Router();

router.get('/:caseReference/client-details/edit/date-of-birth', getEditDateOfBirth);
router.post('/:caseReference/client-details/edit/date-of-birth', ...dateOfBirthValidation, postEditDateOfBirth);

export default router;
