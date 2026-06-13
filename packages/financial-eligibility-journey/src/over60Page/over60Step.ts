import { step, submit, redirect } from '@ministryofjustice/hmpps-forge/core/authoring'
import { continueButton  } from '../commonBlocks.js'
import { over60Field  } from './over60Block.js'
import { FinancialEligibilityEffects } from '../effects.js'
import { STEP_CODES } from '../api.js'

// Branch step for the video path — only reachable when visitType is 'video'.
// All branches converge on check-answers after collecting their details.
export const over60Step = step({
  code: STEP_CODES.OVER_60,
  path: '/over-60',
  title: 'Are you aged over 60?',
  blocks: [over60Field, continueButton],
  onSubmission: [
    submit({
      validate: true,
      onValid: {
        effects: [FinancialEligibilityEffects.SaveNewAnswerIfAnswered()],
        next: [redirect({ goto: 'check-answers' })],
      },
    }),
  ],
})
