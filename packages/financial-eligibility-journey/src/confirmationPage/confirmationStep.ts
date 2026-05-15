import { step, submit, redirect, Condition, Session, tieBreaker } from '@ministryofjustice/hmpps-forge/core/authoring'
import { panel, nextSteps, restartButton } from './confirmationBlock.js'

export const confirmationStep = step({
  code: 'confirmation',
  path: '/confirmation',
  title: 'Visit booked',
  reachability: {
    // Session-based entry — survives ClearDraftAnswers unlike answer-based conditions
    entryWhen: Session('patternSubmitted.branching').match(Condition.Equals(true)),
    // Priority 200 wins over the overview entry point, so a submitted user
    // lands here instead of being sent back to the start.
    tieBreakers: [tieBreaker({ priority: 200 })],
  },
  blocks: [panel, nextSteps, restartButton],
  onSubmission: [
    submit({
      validate: false,
      onAlways: {
        // Reset everything so the user can try a different branch
        effects: [
          // FinancialEligibilityEffects.ClearAnswers('branching'), TODO
          // FinancialEligibilityEffects.ClearDraftAnswers('branching'), TODO
          // FinancialEligibilityEffects.SaveSubmitStateToSession('branching', false), TODO
        ],
        next: [redirect({ goto: 'overview' })],
      },
    }),
  ],
})