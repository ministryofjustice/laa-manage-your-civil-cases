import { submit, redirect } from '@ministryofjustice/hmpps-forge/core/authoring'
import { continueButton  } from '../commonBlocks.js'
import { over60FieldHeading, over60Field  } from './over60Block.js'
import { FinancialEligibilityEffects } from '../effects.js'
import { step, type StepDefinition } from '../authoring.js'
import { checkAnswersStep } from '../checkAnswersPage/checkAnswersStep.js'

const STEP_CODE = 'over-60'

// Branch step for the video path — only reachable when visitType is 'video'.
// All branches converge on check-answers after collecting their details.
export const over60Step: StepDefinition = step({
  code: STEP_CODE,
  path: '/over-60',
  title: 'Are you aged over 60?',
  blocks: [over60FieldHeading, over60Field, continueButton],
  onSubmission: [
    submit({
      validate: true,
      onValid: {
        effects: [FinancialEligibilityEffects.SaveNewAnswerIfAnswered()],
        next: [redirect({ goto: checkAnswersStep.code })],
      },
    }),
  ],
})