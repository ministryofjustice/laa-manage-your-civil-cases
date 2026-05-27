import { Self, Condition, validation, Transformer} from '@ministryofjustice/hmpps-forge/core/authoring'
import { GovUKRadioInput, GovUKUtilityClasses } from '@ministryofjustice/hmpps-forge/govuk-components'

export const over60Field = GovUKRadioInput({
  code: 'over-60',
  fieldset: {
    legend: {
      text: 'About you',
      classes: GovUKUtilityClasses.Fieldset.MediumLabel,
      isPageHeading: true,
    },
  },
  hint: { text: 'Are you aged over 60?' },
  items: [
    { value: 'yes', text: 'Yes' },
    { value: 'no', text: 'No' },
  ],
  validWhen: [
    validation({
      condition: Self().match(Condition.IsRequired()),
      message: 'Select if you are aged over 60',
    }),
  ],
})
