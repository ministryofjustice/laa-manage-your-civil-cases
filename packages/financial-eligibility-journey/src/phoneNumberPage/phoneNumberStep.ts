import { step, submit, redirect } from '@ministryofjustice/hmpps-forge/core/authoring'
import { continueButton } from '../commonBlocks.js'
import { phoneNumberField } from './phoneNumberBlock.js'
import { FinancialEligibilityEffects } from '../effects.js'

// Branch step for the phone path — only reachable when visitType is 'phone'.
// All branches converge on check-answers after collecting their details.
export const phoneNumberStep = step({
  code: 'phone-number',
  path: '/phone-number',
  title: 'What number should we call you on?',
  blocks: [phoneNumberField, continueButton],
  onSubmission: [
    submit({
      validate: true,
      onValid: {
        effects: [FinancialEligibilityEffects.SaveDraftAnswers('branching')],
        next: [redirect({ goto: 'check-answers' })],
      },
    }),
  ],
})