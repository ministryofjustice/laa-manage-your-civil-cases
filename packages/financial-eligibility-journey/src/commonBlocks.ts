import { GovUKButton } from '@ministryofjustice/hmpps-forge/govuk-components'
import { submit, redirect, Post, Condition, Format, Params } from '@ministryofjustice/hmpps-forge/core/authoring'
import { FinancialEligibilityEffects } from './effects.js'

export const continueButton = GovUKButton({ text: 'Continue' })

export const submitButton = GovUKButton({ text: 'Submit' })

// Component and function to trigger the component
export const discardChangesButton = GovUKButton({ text: 'Discard changes', classes: 'govuk-link financial-eligibility-discard-link govuk-!-margin-left-3 govuk-!-margin-top-2', name: 'action', value: 'discard-changes' })

/**
 * Clears the financial eligibility draft answers and redirects the user back to the financial eligibility page
 * @returns {Promise<void>} The submit discard changes action
 */
export const ifPressedDiscardChanges = () => submit({
  when: Post('action').match(Condition.Equals('discard-changes')),
  onAlways: {
    effects: [FinancialEligibilityEffects.ClearDraftAnswers()],
    next: [redirect({ goto: Format('/cases/%1/financial-eligibility/', Params('caseReference')) })], //`%1` will get resolved to caseReference
  },
})