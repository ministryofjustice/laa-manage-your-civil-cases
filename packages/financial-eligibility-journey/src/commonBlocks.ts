import { GovUKHeading, GovUKButton } from '@ministryofjustice/hmpps-forge/govuk-components'
import { submit, redirect, Post, Condition, Format, Params } from '@ministryofjustice/hmpps-forge/core/authoring'
import { FinancialEligibilityEffects } from './effects.js'


export const heading = GovUKHeading({
  text: 'Check your Answers. Financial eligibility branching, based on an earlier answer',
  size: 'm',
})

export const continueButton = GovUKButton({ text: 'Continue' })

export const submitButton = GovUKButton({ text: 'Submit' })

// Component and function to trigger the component
export const discardChangesButton = GovUKButton({ text: 'Discard changes', classes: 'govuk-button--warning govuk-!-margin-left-3', name: 'action', value: 'discard-changes' })

export const discardChangesButtonSubmit = () => submit({
  when: Post('action').match(Condition.Equals('discard-changes')),
  onAlways: {
    effects: [FinancialEligibilityEffects.ClearDraftAnswers()],
    next: [redirect({ goto: Format('/cases/%1/financial-eligibility/', Params('caseReference')) })], //`%1` will get resolved to caseReference
  },
})