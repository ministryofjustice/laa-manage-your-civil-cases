import { Self, Condition, validation} from '@ministryofjustice/hmpps-forge/core/authoring'
import { GovUKRadioInput, GovUKUtilityClasses } from '@ministryofjustice/hmpps-forge/govuk-components'

export const locationField = GovUKRadioInput({
  code: 'location',
  fieldset: {
    legend: {
      text: 'Which office would you like to visit?',
      classes: GovUKUtilityClasses.Fieldset.MediumLabel,
      isPageHeading: true,
    },
  },
  items: [
    { value: 'london', text: 'London' },
    { value: 'manchester', text: 'Manchester' },
    { value: 'cardiff', text: 'Cardiff' },
    { value: 'edinburgh', text: 'Edinburgh' },
  ],
  validWhen: [
    validation({
      condition: Self().match(Condition.IsRequired()),
      message: 'Select an office',
    }),
  ],
})