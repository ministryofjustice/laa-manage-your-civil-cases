import { submit, redirect, Answer, Condition, or } from '@ministryofjustice/hmpps-forge/core/authoring'
import { continueButton, discardChangesButton, ifPressedDiscardChanges } from '../commonBlocks.js'
import { savingsHeading, bankBalanceField, investmentBalanceField, assetBalanceField, creditBalanceField } from './savingsBlock.js'
import { FinancialEligibilityEffects } from '../effects.js'
import { step, type StepDefinition } from '../authoring.js'
import { partnerSavingsStep } from '../partnerSavingsPage/partnerSavingsStep.js'
import { disputedSavingsStep } from '../disputedSavingsPage/disputedSavingsStep.js'
import { disregardsStep } from '../disregardsPage/disregardsStep.js'

const STEP_CODE = 'your-savings'

export const savingsStep: StepDefinition = step({
  code: STEP_CODE,
  path: '/your-savings',
  title: 'Your savings',
  reachability: { entryWhen: true },
  blocks: [savingsHeading, bankBalanceField, investmentBalanceField, assetBalanceField, creditBalanceField, continueButton, discardChangesButton],
  onSubmission: [
    ifPressedDiscardChanges(),
    submit({
      validate: true,
      onValid: {
        effects: [FinancialEligibilityEffects.SaveNewAnswerIfAnswered()],
        next: [
          redirect({
            when: Answer('has-partner').match(Condition.Equals('yes')),
            goto: partnerSavingsStep.code
          }),
          redirect({
            when: or (
              Answer('category').match(Condition.Equals('debt')), 
              Answer('category').match(Condition.Equals('family'))
            ),
            goto: disputedSavingsStep.code
          }),
          redirect({
            goto: disregardsStep.code
          })
        ],
      },
    }),
  ],
})