import { Self, Condition, validation} from '@ministryofjustice/hmpps-forge/core/authoring'
import { GovUKRadioInput, GovUKUtilityClasses } from '@ministryofjustice/hmpps-forge/govuk-components'

export const partnerField = GovUKRadioInput({
  code: 'partner',
  fieldset: {
    legend: {
      text: 'About you',
      classes: GovUKUtilityClasses.Fieldset.MediumLabel,
      isPageHeading: true,
    },
  },
  hint: { text: 'Do you have a partner?' },
  items: [
    { value: 'yes', text: 'Yes' },
    { value: 'no', text: 'No' },
  ],
  validWhen: [
    validation({
      condition: Self().match(Condition.IsRequired()),
      message: 'Select if you have a partner',
    }),
  ],
})