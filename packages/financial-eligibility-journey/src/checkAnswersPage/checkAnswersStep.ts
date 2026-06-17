import { step, submit, redirect, Condition, Session } from '@ministryofjustice/hmpps-forge/core/authoring'
import { heading, submitButton } from '../commonBlocks.js'
import { summaryList } from './checkAnswersBlock.js'
import { FinancialEligibilityEffects } from '../effects.js'
import { type StepDefinition } from '../authoring.js'


const STEP_CODE = 'check-answers'

export const checkAnswersStep: StepDefinition = step({
  code: STEP_CODE,
  path: '/check-answers',
  title: 'Check your answers',
  blocks: [heading, summaryList, submitButton],
  onSubmission: [
    submit({
      validate: false,
      onAlways: {
        effects: [
          FinancialEligibilityEffects.PersistSavedAnswers(),
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