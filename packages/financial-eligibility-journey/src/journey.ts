import { journey, access } from '@ministryofjustice/hmpps-forge/core/authoring'
import { FinancialEligibilityEffects, requireAuth } from './effects.js'
import { under17Step } from './under17Page/under17Step.js'
import { under18RegularPaymentStep }from './under18RegularPaymentPage/under18RegularPaymentStep.js'
import { under18HasValuablesStep }from './under18HasValuablesPage/under18HasValuablesStep.js'
import { partnerStep } from './partnerPage/partnerStep.js'
import { over60Step } from './over60Page/over60Step.js'
import { checkAnswersStep } from './checkAnswersPage/checkAnswersStep.js'

// The loads any stored draft answers on every access, so switching between branches preserves earlier input.
// The summary page filters rows to the  branch the user is currently on.
export const eligibilityJourney = journey({
  code: 'financial-eligibility',
  title: 'Financial eligibility, based on an earlier answer',
  path: '/cases/:caseReference/financial-eligibility/change',
  onAccess: [
    access({
      effects: [
        FinancialEligibilityEffects.LoadCaseDetails(),
        FinancialEligibilityEffects.LoadCaseFinancialEligibility(),
      ],
    }),
    requireAuth()
  ],
  view: { template: 'case_details/forge_forms/financial-eligibility-form' },
  steps: [
    under17Step,
    under18RegularPaymentStep,
    under18HasValuablesStep,
    partnerStep,
    over60Step,
    checkAnswersStep,
  ],
})