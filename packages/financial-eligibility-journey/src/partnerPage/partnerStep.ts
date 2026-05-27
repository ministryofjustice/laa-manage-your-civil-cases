import { step, submit, redirect } from '@ministryofjustice/hmpps-forge/core/authoring'
import { continueButton  } from '../commonBlocks.js'
import { partnerField } from './partnerBlock.js'
import { FinancialEligibilityEffects } from '../effects.js'

// Forge's reachability keeps users off this step via the URL if their earlier answer was different.
export const partnerStep = step({
  code: 'partner',
  path: '/partner',
  title: 'Do you have a partner?',
  blocks: [partnerField, continueButton],
  onSubmission: [
    submit({
      validate: true,
      onValid: {
        effects: [FinancialEligibilityEffects.SaveDraftAnswers()],
        next: [redirect({ goto: 'over-60' })],
      },
    }),
  ],
})
