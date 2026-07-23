import { submit, redirect, Answer, Condition, and } from '@ministryofjustice/hmpps-forge/core/authoring'
import { step, type StepDefinition } from '../authoring.js'
import { continueButton, discardChangesButton, discardChangesButtonSubmit } from '../commonBlocks.js'
import { partnerFieldHeading, partnerField } from './partnerBlock.js'
import { FinancialEligibilityEffects } from '../effects.js'
import { over60Step } from '../over60Page/over60Step.js'
import { over60StepWithPartnerStep } from '../over60PWithPartnerPage/over60WithPartnerStep.js'
import { benefitsStep } from '../benefitsPage/benefitsStep.js'

const STEP_CODE = 'has-partner'

export const partnerStep: StepDefinition = step({
  code: STEP_CODE,
  path: '/has-partner',
  title: 'Do you have a partner?',
  reachability: { entryWhen: true },
  blocks: [partnerFieldHeading, partnerField, continueButton, discardChangesButton],
  onSubmission: [
    discardChangesButtonSubmit(),
    submit({
      validate: true,
      onValid: {
        effects: [FinancialEligibilityEffects.SaveNewAnswerIfAnswered()],
        next: [
          redirect({
            when: and (Answer(STEP_CODE).match(Condition.Equals('yes')), Answer('under-18').match(Condition.Equals('yes'))),
            goto: benefitsStep.code,
          }),
          redirect({
            when: Answer(STEP_CODE).match(Condition.Equals('yes')),
            goto: over60StepWithPartnerStep.code,
          }),
          redirect({
            when: and (Answer(STEP_CODE).match(Condition.Equals('no')), Answer('under-18').match(Condition.Equals('yes'))),
            goto: benefitsStep.code,
          }),
          redirect({
            when: Answer(STEP_CODE).match(Condition.Equals('no')),
            goto: over60Step.code,
          })
        ],
      },
    }),
  ],
})