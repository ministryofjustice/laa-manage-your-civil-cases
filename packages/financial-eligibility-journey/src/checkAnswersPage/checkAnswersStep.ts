import { step, submit, redirect, Condition, Session, Data, Query, Params, Iterator, Item, Transformer, Format } from '@ministryofjustice/hmpps-forge/core/authoring'
import { heading, submitButton } from '../commonBlocks.js'
import { summaryList } from './checkAnswersBlock.js'
import { FinancialEligibilityEffects } from '../effects.js'
import { type StepDefinition } from '../authoring.js'

const STEP_CODE = 'check-answers'

export const checkAnswersStep: StepDefinition = step({
  code: STEP_CODE,
  path: '/check-answers',
  title: 'Check your answers',
  reachability: { entryWhen: true },
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
            goto: '..',
          }),
        ],
      },
    }),
  ],
})