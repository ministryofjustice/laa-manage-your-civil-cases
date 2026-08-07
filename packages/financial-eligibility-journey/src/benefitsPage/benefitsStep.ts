import { submit, redirect } from '@ministryofjustice/hmpps-forge/core/authoring'
import { continueButton, discardChangesButton, ifPressedDiscardChanges } from '../commonBlocks.js'
import { benefitsHeading, universalCreditField, incomeSupportField, incomeBasedJSAField, pensionCreditField, employmentSupportField } from './benefitsBlock.js'
import { FinancialEligibilityEffects } from '../effects.js'
import { step, type StepDefinition } from '../authoring.js'
import { propertiesStep } from '../propertiesPage/propertiesStep.js'

const STEP_CODE = 'benefits'

export const benefitsStep: StepDefinition = step({
  code: STEP_CODE,
  path: '/benefits',
  title: 'Benefits',
  reachability: { entryWhen: true },
  blocks: [benefitsHeading, universalCreditField, incomeSupportField, incomeBasedJSAField, pensionCreditField, employmentSupportField, continueButton, discardChangesButton],
  onSubmission: [
    ifPressedDiscardChanges(),
    submit({
      validate: true,
      onValid: {
        effects: [FinancialEligibilityEffects.SaveNewAnswerIfAnswered()],
        next: [redirect({ goto: propertiesStep.code })],
      },
    }),
  ],
})