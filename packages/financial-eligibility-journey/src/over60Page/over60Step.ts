import { submit, redirect } from '@ministryofjustice/hmpps-forge/core/authoring'
import { continueButton, discardChangesButton, discardChangesButtonSubmit } from '../commonBlocks.js'
import { over60FieldHeading, over60Field  } from './over60Block.js'
import { FinancialEligibilityEffects } from '../effects.js'
import { step, type StepDefinition } from '../authoring.js'
import { benefitsStep } from '../benefitsPage/benefitsStep.js'

const STEP_CODE = 'over-60'

export const over60Step: StepDefinition = step({
  code: STEP_CODE,
  path: '/over-60',
  title: 'Are you aged over 60?',
  reachability: { entryWhen: true },
  blocks: [over60FieldHeading, over60Field, continueButton, discardChangesButton],
  onSubmission: [
    discardChangesButtonSubmit(),
    submit({
      validate: true,
      onValid: {
        effects: [FinancialEligibilityEffects.SaveNewAnswerIfAnswered()],
        next: [redirect({ goto: benefitsStep.code })],
      },
    }),
  ],
})