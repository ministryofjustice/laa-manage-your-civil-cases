import { step, submit, redirect, Condition, Session } from '@ministryofjustice/hmpps-forge/core/authoring'
import { heading, submitButton } from '../commonBlocks.js'
import { summaryList } from './checkAnswersBlock.js'
import { FinancialEligibilityEffects } from '../effects.js'


export const checkAnswersStep = step({
  code: 'check-answers',
  path: '/check-answers',
  title: 'Check your answers',
  blocks: [heading, summaryList, submitButton],
  onSubmission: [
    submit({
      validate: false,
      onAlways: {
        effects: [
          FinancialEligibilityEffects.SubmitSavedAnswersToClaBackend(),
          FinancialEligibilityEffects.ClearDraftAnswers()
        ],
        next: [
          redirect({
            // TOOD: This should be a redirection to the case details page.
            // It's not done yet because I haven't figured out how to get the case reference
            // from the context in this step definition.
            goto: '/',
          }),
        ],
      },
    }),
  ],
})