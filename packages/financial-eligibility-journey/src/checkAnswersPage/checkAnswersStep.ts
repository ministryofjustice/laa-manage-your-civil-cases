import { step, submit, redirect, Condition, Session } from '@ministryofjustice/hmpps-forge/core/authoring'
import { heading, submitButton } from '../commonBlocks.js'
import { summaryList } from './checkAnswersBlock.js'


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
          // Persist answers permanently, mark submitted in session, then clear drafts
          // FinancialEligibilityEffects.SaveAnswers('branching'), TODO
          // FinancialEligibilityEffects.SaveSubmitStateToSession('branching', true), TODO
          // FinancialEligibilityEffects.ClearDraftAnswers('branching'), TODO
        ],
        next: [
          redirect({
            // Gate on session state so the redirect only fires after the effects
            // above have run — the session value survives ClearDraftAnswers.
            when: Session('patternSubmitted.branching').match(Condition.Equals(true)),
            goto: 'confirmation',
          }),
        ],
      },
    }),
  ],
})