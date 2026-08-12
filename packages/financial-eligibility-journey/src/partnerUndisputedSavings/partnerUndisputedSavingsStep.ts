import { submit, redirect, Answer, Condition, or } from '@ministryofjustice/hmpps-forge/core/authoring'
import { continueButton, discardChangesButton, ifPressedDiscardChanges } from '../commonBlocks.js'
import { savingsHeading, bankBalanceField, investmentBalanceField, assetBalanceField, creditBalanceField } from './partnerUndisputedSavingsBlock.js'
import { FinancialEligibilityEffects } from '../effects.js'
import { step, type StepDefinition } from '../authoring.js'
import { partnerSavingsStep } from '../partnerSavingsPage/partnerSavingsStep.js'
import { disputedSavingsStep } from '../disputedSavingsPage/disputedSavingsStep.js'
import { disregardsStep } from '../disregardsPage/disregardsStep.js'

const STEP_CODE = 'partner-undisputed-savings'

export const partnerUndisputedSavingsStep: StepDefinition = step({
  code: STEP_CODE,
  path: '/partner-undisputed-savings',
  title: 'Partner undisputed savings',
  reachability: { entryWhen: true },
  blocks: [savingsHeading, bankBalanceField, investmentBalanceField, assetBalanceField, creditBalanceField, continueButton, discardChangesButton],
  onSubmission: [
    ifPressedDiscardChanges(),
    submit({
      validate: true,
      onValid: {
        effects: [FinancialEligibilityEffects.SaveNewAnswerIfAnswered()],
        next: [redirect({goto: disputedSavingsStep.code}),],
      },
    }),
  ],
})