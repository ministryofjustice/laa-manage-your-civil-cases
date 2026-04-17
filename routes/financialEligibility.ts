import express from 'express';

import {
  getFinancialEligibilityDetailsTab,
  getFinancialEligibilityEditAssessmentSteps,
  getFinancialEligibilityFieldsForm,
  postFinancialEligibilityFieldsForm,
} from '#src/scripts/controllers/index.js';
import { fetchClientDetails } from '#src/middlewares/indexSchema.js';


const router = express.Router();

router.get('/:caseReference/financial-eligibility', getFinancialEligibilityDetailsTab);
router.get('/:caseReference/financial-eligibility/edit-assessment-steps', fetchClientDetails, getFinancialEligibilityEditAssessmentSteps); // To allow users to navigate back to the form using the back button after POST

router.get('/:caseReference/financial-eligibility/:page', getFinancialEligibilityFieldsForm)
router.post('/:caseReference/financial-eligibility/form', postFinancialEligibilityFieldsForm);

export default router;
