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
          // FinancialEligibilityEffects.ClearDraftAnswers()
        ],
        next: [
          redirect({
            // Gate on session state so the redirect only fires after the effects
            // above have run — the session value survives ClearDraftAnswers.
            // when: Session('patternSubmitted').match(Condition.Equals(true)),
            // goto: '/cases/:caseReference/financial-eligibility',
            goto: '/',
          }),
        ],
      },
    }),
  ],
})