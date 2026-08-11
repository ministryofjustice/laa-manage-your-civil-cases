import { submit, redirect } from '@ministryofjustice/hmpps-forge/core/authoring'
import { continueButton, discardChangesButton, ifPressedDiscardChanges } from '../commonBlocks.js'
import { disregardsHeading, disregardsField } from './disregardsBlock.js'
import { FinancialEligibilityEffects } from '../effects.js'
import { step, type StepDefinition } from '../authoring.js'
import { checkAnswersStep } from '../checkAnswersPage/checkAnswersStep.js'

const STEP_CODE = 'disregards'

export const disregardsStep: StepDefinition = step({
  code: STEP_CODE,
  path: '/disregards',
  title: 'Disregards',
  reachability: { entryWhen: true },
  blocks: [disregardsHeading, disregardsField, continueButton, discardChangesButton],
  onSubmission: [
    ifPressedDiscardChanges(),
    submit({
      validate: true,
      onValid: {
        effects: [FinancialEligibilityEffects.SaveNewAnswerIfAnswered()],
        next: [redirect({ goto: checkAnswersStep.code })],
      },
    }),
  ],
})