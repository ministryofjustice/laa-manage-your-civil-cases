import { step, submit, redirect } from '@ministryofjustice/hmpps-forge/core/authoring'
import { continueButton  } from '../commonBlocks.js'
import { partnerField } from './partnerBlock.js'
import { FinancialEligibilityEffects } from '../effects.js'
import { STEP_CODES } from '../api.js'

// Forge's reachability keeps users off this step via the URL if their earlier answer was different.
export const partnerStep = step({
  code: STEP_CODES.HAS_PARTNER,
  path: '/partner',
  title: 'Do you have a partner?',
  blocks: [partnerField, continueButton],
  onSubmission: [
    submit({
      validate: true,
      onValid: {
        effects: [FinancialEligibilityEffects.SaveNewAnswerIfAnswered()],
        next: [redirect({ goto: 'over-60' })],
      },
    }),
  ],
})
