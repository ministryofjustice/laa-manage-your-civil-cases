import { GovUKHeading, GovUKButton } from '@ministryofjustice/hmpps-forge/govuk-components'
export const heading = GovUKHeading({
  text: 'Check your Answers. Financial eligibility branching, based on an earlier answer',
  size: 'm',
})

export const continueButton = GovUKButton({ text: 'Continue' })

export const discardChangesButton = GovUKButton({ text: 'Discard changes', classes: 'govuk-button--warning govuk-!-margin-left-3' })

export const submitButton = GovUKButton({ text: 'Submit' })