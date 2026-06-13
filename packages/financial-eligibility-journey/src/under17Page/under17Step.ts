import { step, submit, redirect, Answer, Condition } from '@ministryofjustice/hmpps-forge/core/authoring'
import { continueButton } from '../commonBlocks.js'
import { under17Field } from './under17Block.js'
import { FinancialEligibilityEffects } from '../effects.js'
import { STEP_CODES } from '../api.js'

// The branching happens here. After saving, the next[] array is evaluated in order: 
// - the first redirect whose `when` matches wins. 
// - only one of them will fire per submit.
export const under17GroupStep = step({
  code: STEP_CODES.UNDER_17,
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
            when: Answer(STEP_CODES.UNDER_17).match(Condition.Equals('yes')),
            goto: 'check-answers',
          }),
          redirect({
            when: Answer(STEP_CODES.UNDER_17).match(Condition.Equals('no')),
            goto: STEP_CODES.HAS_PARTNER,
          }),
          redirect({
            goto: STEP_CODES.HAS_PARTNER,
          })
        ],
      },
    }),
  ],
})
