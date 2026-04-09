import express from 'express';

import {
  getFinancialEligibilityDetailsTab,
  getFinancialEligibilityFieldsForm,
  postFinancialEligibilityFieldsForm,
} from '#src/scripts/controllers/index.js';


const router = express.Router();

router.get('/:caseReference/financial-eligibility', getFinancialEligibilityDetailsTab);

router.get('/:caseReference/financial-eligibility/:question', getFinancialEligibilityFieldsForm)
router.post('/:caseReference/financial-eligibility/form', postFinancialEligibilityFieldsForm);

export default router;
