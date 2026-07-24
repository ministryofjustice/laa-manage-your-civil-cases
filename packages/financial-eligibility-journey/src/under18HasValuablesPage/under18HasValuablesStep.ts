import { submit, redirect } from '@ministryofjustice/hmpps-forge/core/authoring'
import { step, type StepDefinition } from '../authoring.js'
import { continueButton, discardChangesButton, discardChangesButtonSubmit } from '../commonBlocks.js'
import { under18HasValuablesHeading, under18HasValuablesField } from './under18HasValuablesBlock.js'
import { FinancialEligibilityEffects } from '../effects.js'
import { partnerStep } from '../partnerPage/partnerStep.js'

const STEP_CODE = 'under-18-has-valuables'

export const under18HasValuablesStep: StepDefinition = step({
  code: STEP_CODE,
  path: '/under-18-has-valuables',
  title: 'Do you receive any money on a regular basis?',
  reachability: { entryWhen: true },
  blocks: [under18HasValuablesHeading, under18HasValuablesField, continueButton, discardChangesButton],
  onSubmission: [
    discardChangesButtonSubmit(),
    submit({
      validate: true,
      onValid: {
        effects: [FinancialEligibilityEffects.SaveNewAnswerIfAnswered()],
        next: [redirect({ goto: partnerStep.code })],
      },
    }),
  ],
})