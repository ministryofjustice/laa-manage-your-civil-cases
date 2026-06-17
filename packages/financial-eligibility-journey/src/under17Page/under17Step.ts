import { submit, redirect, Answer, Condition } from '@ministryofjustice/hmpps-forge/core/authoring'
import { step, type StepDefinition } from '../authoring.js'
import { continueButton } from '../commonBlocks.js'
import { under17Field } from './under17Block.js'
import { FinancialEligibilityEffects } from '../effects.js'
import { partnerStep } from '../partnerPage/partnerStep.js'
import { checkAnswersStep } from '../checkAnswersPage/checkAnswersStep.js'


const STEP_CODE = 'under17'

// The branching happens here. After saving, the next[] array is evaluated in order: 
// - the first redirect whose `when` matches wins. 
// - only one of them will fire per submit.
export const under17GroupStep: StepDefinition = step({
  code: STEP_CODE,
  path: '/under-17',
  title: 'Are you aged 17 or under?',
  reachability: { entryWhen: true },
  blocks: [under17Field, continueButton],
  onSubmission: [
    submit({
      validate: true,
      onValid: {
        effects: [
          FinancialEligibilityEffects.SaveNewAnswerIfAnswered(),
        ],
        next: [
          redirect({
            when: Answer(STEP_CODE).match(Condition.Equals('yes')),
            goto: checkAnswersStep.code,
          }),
          redirect({
            when: Answer(STEP_CODE).match(Condition.Equals('no')),
            goto: partnerStep.code,
          }),
          redirect({
            goto: partnerStep.code,
          })
        ],
      },
    }),
  ],
})
