import { journey, access } from '@ministryofjustice/hmpps-forge/core/authoring'
import { FinancialEligibilityEffects, requireAuth } from './effects.js'
import { clientAgeGroupStep } from './clientAgeGroupPage/clientAgeGroupStep.js'
import { locationStep } from './locationPage/locationStep.js'
import { videoEmailStep } from './videoEmailPage/videoEmailStep.js'
import { phoneNumberStep } from './phoneNumberPage/phoneNumberStep.js'
import { checkAnswersStep } from './checkAnswersPage/checkAnswersStep.js'
import { confirmationStep } from './confirmationPage/confirmationStep.js'

// The loads any stored draft answers on every access, so switching between branches preserves earlier input.
// The summary page filters rows to the  branch the user is currently on.
export const eligibilityJourney = journey({
  code: 'financial-eligibility',
  title: 'Financial eligibility, based on an earlier answer',
  path: '/cases/:caseReference/financial-eligibility/change',
  onAccess: [
    access({
      effects: [FinancialEligibilityEffects.LoadDraftAnswers('branching')],
    }),
    requireAuth()
  ],
  view: { template: 'case_details/forge_forms/financial-eligibility-form' },
  steps: [
    clientAgeGroupStep,
    locationStep,
    videoEmailStep,
    phoneNumberStep,
    checkAnswersStep,
    confirmationStep,
  ],
})