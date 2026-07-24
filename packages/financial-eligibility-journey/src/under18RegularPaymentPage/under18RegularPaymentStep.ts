import { submit, redirect } from '@ministryofjustice/hmpps-forge/core/authoring'
import { step, type StepDefinition } from '../authoring.js'
import { continueButton, discardChangesButton, discardChangesButtonSubmit } from '../commonBlocks.js'
import { under18RegularPaymentHeading, under18RegularPaymentField } from './under18RegularPaymentBlock.js'
import { FinancialEligibilityEffects } from '../effects.js'
import { under18HasValuablesStep } from '../under18HasValuablesPage/under18HasValuablesStep.js'

const STEP_CODE = 'under-18-receives-regular-payment'

export const under18RegularPaymentStep: StepDefinition = step({
  code: STEP_CODE,
  path: '/under-18-receives-regular-payment',
  title: 'Do you receive any money on a regular basis?',
  reachability: { entryWhen: true },
  blocks: [under18RegularPaymentHeading, under18RegularPaymentField, continueButton, discardChangesButton],
  onSubmission: [
    discardChangesButtonSubmit(),
    submit({
      validate: true,
      onValid: {
        effects: [FinancialEligibilityEffects.SaveNewAnswerIfAnswered()],
        next: [redirect({ goto: under18HasValuablesStep.code })],
      },
    }),
  ],
})