import { submit, redirect } from '@ministryofjustice/hmpps-forge/core/authoring'
import { step, type StepDefinition } from '../authoring.js'
import { continueButton  } from '../commonBlocks.js'
import { partnerField } from './partnerBlock.js'
import { FinancialEligibilityEffects } from '../effects.js'
import { over60Step } from '../over60Page/over60Step.js'

const STEP_CODE = 'partner'

// Forge's reachability keeps users off this step via the URL if their earlier answer was different.
export const partnerStep: StepDefinition = step({
  code: STEP_CODE,
  path: '/partner',
  title: 'Do you have a partner?',
  blocks: [partnerField, continueButton],
  onSubmission: [
    submit({
      validate: true,
      onValid: {
        effects: [FinancialEligibilityEffects.SaveNewAnswerIfAnswered()],
        next: [redirect({ goto: over60Step.code })],
      },
    }),
  ],
})
