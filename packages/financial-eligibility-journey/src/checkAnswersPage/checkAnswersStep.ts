import { step, submit, redirect, access } from '@ministryofjustice/hmpps-forge/core/authoring'
import { submitButton, discardChangesButton, ifPressedDiscardChanges } from '../commonBlocks.js'
import { checkYourAnswersHeading, aboutYouSummaryList, benefitsSummaryList, financesHeading, propertiesSummaryList, savingsSummaryList, partnerSavingsSummaryList, disputedSavingsSummaryList, disregardsSummaryList } from './checkAnswersBlock.js'
import { FinancialEligibilityEffects, PatternEffects } from '../effects.js'
import { type StepDefinition } from '../authoring.js'

const STEP_CODE = 'check-answers'
const propertiesStepCode = 'properties'
const propertiesCollectionCode = 'propertySet'
const propertiesFieldCodes = ['value', 'mortgage-left', 'disputed', 'main', 'share']

export const checkAnswersStep: StepDefinition = step({
  code: STEP_CODE,
  path: '/check-answers',
  title: 'Check your answers',
  reachability: { entryWhen: true },
  blocks: [checkYourAnswersHeading, aboutYouSummaryList, benefitsSummaryList, financesHeading, propertiesSummaryList, savingsSummaryList, partnerSavingsSummaryList, disputedSavingsSummaryList, disregardsSummaryList, submitButton, discardChangesButton],
  onAccess: [
    access({
      effects: [PatternEffects.InitialiseRepeatingFieldset(propertiesStepCode, propertiesCollectionCode, propertiesFieldCodes)],
    }),
  ],
  onSubmission: [
    ifPressedDiscardChanges(),
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