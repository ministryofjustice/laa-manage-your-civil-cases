import { step, submit, redirect } from '@ministryofjustice/hmpps-forge/core/authoring'
import { continueButton  } from '../commonBlocks.js'
import { locationField } from './locationBlock.js'
import { FinancialEligibilityEffects } from '../effects.js'

// Forge's reachability keeps users off this step via the URL if their earlier answer was different.
export const locationStep = step({
  code: 'location',
  path: '/location',
  title: 'Which office would you like to visit?',
  blocks: [locationField, continueButton],
  onSubmission: [
    submit({
      validate: true,
      onValid: {
        effects: [FinancialEligibilityEffects.SaveDraftAnswers()],
        next: [redirect({ goto: 'check-answers' })],
      },
    }),
  ],
})
