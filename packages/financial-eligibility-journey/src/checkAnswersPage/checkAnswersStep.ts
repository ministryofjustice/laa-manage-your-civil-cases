import { step, submit, redirect } from '@ministryofjustice/hmpps-forge/core/authoring'
import { heading, submitButton, discardChangesButton } from '../commonBlocks.js'
import { aboutYouSummaryList, benefitsSummaryList } from './checkAnswersBlock.js'
import { FinancialEligibilityEffects } from '../effects.js'
import { type StepDefinition } from '../authoring.js'

const STEP_CODE = 'check-answers'

export const checkAnswersStep: StepDefinition = step({
  code: STEP_CODE,
  path: '/check-answers',
  title: 'Check your answers',
  reachability: { entryWhen: true },
  blocks: [heading, aboutYouSummaryList, benefitsSummaryList, submitButton, discardChangesButton],
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
            goto: '..',
          }),
        ],
      },
    }),
  ],
})