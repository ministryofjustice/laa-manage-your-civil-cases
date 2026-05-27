import { step, submit, redirect } from '@ministryofjustice/hmpps-forge/core/authoring'
import { continueButton  } from '../commonBlocks.js'
import { videoEmailField  } from './videoEmailBlock.js'
import { FinancialEligibilityEffects } from '../effects.js'

// Branch step for the video path — only reachable when visitType is 'video'.
// All branches converge on check-answers after collecting their details.
export const videoEmailStep = step({
  code: 'video-email',
  path: '/video-email',
  title: 'What email should we send the invite to?',
  blocks: [videoEmailField, continueButton],
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
