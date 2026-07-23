import { Self, Condition, validation } from '@ministryofjustice/hmpps-forge/core/authoring'
import { GovUKRadioInput , GovUKUtilityClasses } from '@ministryofjustice/hmpps-forge/govuk-components'

// A plain radio with three options. The selected value drives the redirect in
// the step's submit hook, so the field only needs a required rule here.
export const under17Field= GovUKRadioInput({
  code: 'under17',
  fieldset: {
    legend: {
      text: 'About you',
      classes: GovUKUtilityClasses.Fieldset.MediumLabel,
      isPageHeading: true,
    },
  },
  hint: { text: 'Are you aged 17 or under?' },
  items: [
    { value: 'yes', text: 'Yes' },
    { value: 'no', text: 'No' },
  ],
  validWhen: [
    validation({
      condition: Self().match(Condition.IsRequired()),
      message: 'Select the age group your client is in',
    }),
  ],
})