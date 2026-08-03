import { submit, redirect, Answer, Condition, or } from '@ministryofjustice/hmpps-forge/core/authoring'
import { continueButton, discardChangesButton, ifPressedDiscardChanges } from '../commonBlocks.js'
import { partnerSavingsHeading, bankBalanceField, investmentBalanceField, assetBalanceField, creditBalanceField } from './partnerSavingsBlock.js'
import { FinancialEligibilityEffects } from '../effects.js'
import { step, type StepDefinition } from '../authoring.js'
import { disputedSavingsStep } from '../disputedSavingsPage/disputedSavingsStep.js'
import { disregardsStep } from '../disregardsPage/disregardsStep.js'

const STEP_CODE = 'partner-savings'

export const partnerSavingsStep: StepDefinition = step({
  code: STEP_CODE,
  path: '/partner-savings',
  title: 'Your partner\'s savings',
  reachability: { entryWhen: true },
  blocks: [partnerSavingsHeading, bankBalanceField, investmentBalanceField, assetBalanceField, creditBalanceField, continueButton, discardChangesButton],
  onSubmission: [
    ifPressedDiscardChanges(),
    submit({
      validate: true,
      onValid: {
        effects: [FinancialEligibilityEffects.SaveNewAnswerIfAnswered()],
        next: [
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