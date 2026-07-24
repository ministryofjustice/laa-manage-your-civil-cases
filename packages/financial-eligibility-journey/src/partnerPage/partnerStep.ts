import { submit, redirect, Answer, Condition } from '@ministryofjustice/hmpps-forge/core/authoring'
import { step, type StepDefinition } from '../authoring.js'
import { continueButton, discardChangesButton } from '../commonBlocks.js'
import { partnerFieldHeading, partnerField } from './partnerBlock.js'
import { FinancialEligibilityEffects } from '../effects.js'
import { over60Step } from '../over60Page/over60Step.js'
import { over60StepWithPartnerStep } from '../over60PWithPartnerPage/over60WithPartnerStep.js'

const STEP_CODE = 'partner'

export const partnerStep: StepDefinition = step({
  code: STEP_CODE,
  path: '/partner',
  title: 'Do you have a partner?',
  reachability: { entryWhen: true },
  blocks: [partnerFieldHeading, partnerField, continueButton, discardChangesButton],
  onSubmission: [
    submit({
      validate: true,
      onValid: {
        effects: [FinancialEligibilityEffects.SaveNewAnswerIfAnswered()],
        next: [
          redirect({
            when: Answer(STEP_CODE).match(Condition.Equals('yes')),
            goto: over60StepWithPartnerStep.code,
          }),
          redirect({
            when: Answer(STEP_CODE).match(Condition.Equals('no')),
            goto: over60Step.code,
          }),
          redirect({
            goto: over60Step.code,
          })
        ],
      },
    }),
  ],
})