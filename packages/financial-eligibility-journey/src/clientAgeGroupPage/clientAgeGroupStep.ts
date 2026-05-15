import { step, submit, redirect, Answer, Condition } from '@ministryofjustice/hmpps-forge/core/authoring'
import { continueButton } from '../commonBlocks.js'
import { clientAgeGroupField } from './clientAgeGroupBlock.js'
import { FinancialEligibilityEffects } from '../effects.js'

// The branching happens here. After saving, the next[] array is evaluated in order: 
// - the first redirect whose `when` matches wins. 
// - the final redirect has no `when`, so it acts as a fallback. 
// - only one of them will fire per submit.
export const clientAgeGroupStep = step({
  code: 'client-age-group',
  path: '/client-age-group',
  title: 'What age is your client?',
  reachability: { entryWhen: true },
  blocks: [clientAgeGroupField, continueButton],
  onSubmission: [
    submit({
      validate: true,
      onValid: {
        effects: [FinancialEligibilityEffects.SaveDraftAnswers('branching')],
        next: [
          redirect({
            when: Answer('clientAgeGroup').match(Condition.Equals('in-person')),
            goto: 'location',
          }),
          redirect({
            when: Answer('clientAgeGroup').match(Condition.Equals('video')),
            goto: 'video-email',
          }),
          redirect({ goto: 'phone-number' }),
        ],
      },
    }),
  ],
})
