import { Self, Condition, validation } from '@ministryofjustice/hmpps-forge/core/authoring'
import { GovUKRadioInput , GovUKUtilityClasses } from '@ministryofjustice/hmpps-forge/govuk-components'

// A plain radio with three options. The selected value drives the redirect in
// the step's submit hook, so the field only needs a required rule here.
export const clientAgeGroupField= GovUKRadioInput({
  code: 'clientAgeGroup',
  fieldset: {
    legend: {
      text: 'What age is your client?',
      classes: GovUKUtilityClasses.Fieldset.MediumLabel,
      isPageHeading: true,
    },
  },
  hint: { text: 'Some clients under 18 may not need a full means test' },
  items: [
    { value: 'in-person', text: 'Under 18' },
    { value: 'video', text: '18 to 59' },
    { value: 'phone', text: '60 or over' },
  ],
  validWhen: [
    validation({
      condition: Self().match(Condition.IsRequired()),
      message: 'Select the age group your client is in',
    }),
  ],
})