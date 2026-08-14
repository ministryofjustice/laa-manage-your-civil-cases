import { Self, Condition, validation, Transformer } from '@ministryofjustice/hmpps-forge/core/authoring'
import { GovUKHeading, GovUKTextInput, GovUKSelectInput, GovUKUtilityClasses, GovUKGridRow } from '@ministryofjustice/hmpps-forge/govuk-components'

// The frequency a money field applies to. Defaults to 'per_month' when nothing has been entered yet.
// Single source of truth: also drives `frequencyText()` in checkAnswersBlock.ts, so a new frequency
// value only needs to be added here.
export const frequencyItems = [
  { value: 'per_week', text: 'Per week' },
  { value: 'per_2week', text: '2 weekly' },
  { value: 'per_4week', text: '4 weekly' },
  { value: 'per_month', text: 'Per month' },
  { value: 'per_year', text: 'Per year' },
]

export interface MoneyFieldConfig {
  code: string;
  label: string;
  emptyMessage: string;
  invalidMessage: string;
  frequencyLabel: string;
  frequencyMessage: string;
  // Shown as a suffix on the amount field itself, for fields with no frequency dropdown (fixed at 'per_month')
  fixedFrequencySuffix?: string;
}

/**
 * Creates the amount input for a money field, shared across the income and expenses pages
 * @param {MoneyFieldConfig} config The field's code, label and validation messages
 * @returns {GovUKTextInput} The configured amount field
 */
export function createAmountField(config: MoneyFieldConfig) {
  return GovUKTextInput({
    code: config.code,
    label: { html: `Amount <span class="govuk-visually-hidden">for ${config.label}</span>` },
    formatters: [Transformer.String.ToFloat()],
    prefix: { text: '£' },
    ...(config.fixedFrequencySuffix ? { suffix: { text: config.fixedFrequencySuffix } } : {}),
    inputType: 'number',
    classes: GovUKUtilityClasses.Input.Width10,
    validWhen: [
      validation({
        condition: Self().match(Condition.IsRequired()),
        message: config.emptyMessage,
      }),
      validation({
        condition: Self().match(Condition.Number.GreaterThanOrEqual(0)),
        message: config.invalidMessage,
      }),
    ],
  })
}

/**
 * Creates the frequency select paired with a money field, defaulting to 'per_month'
 * @param {MoneyFieldConfig} config The field's code and frequency validation message
 * @returns {GovUKSelectInput} The configured frequency field
 */
export function createFrequencyField(config: MoneyFieldConfig) {
  return GovUKSelectInput({
    code: `${config.code}-frequency`,
    label: { html: `Frequency <span class="govuk-visually-hidden">for ${config.label}</span>` },
    defaultValue: 'per_month',
    items: frequencyItems,
    validWhen: [
      validation({
        condition: Self().match(Condition.IsRequired()),
        message: config.frequencyMessage,
      }),
    ],
  })
}

/**
 * Shows the field's question as a heading, then lays its amount and frequency fields out side by side
 * @param {MoneyFieldConfig} config The field's question text
 * @param {ReturnType<typeof createAmountField>} amountField The amount input block
 * @param {ReturnType<typeof createFrequencyField>} frequencyField The paired frequency select block
 * @returns {unknown[]} The question heading followed by the two fields in a two-column grid row
 */
export function createMoneyFieldRow(config: MoneyFieldConfig, amountField: ReturnType<typeof createAmountField>, frequencyField: ReturnType<typeof createFrequencyField>) {
  return [
    GovUKHeading({ text: config.label, size: 's', classes: 'govuk-!-margin-bottom-2' }),
    GovUKGridRow({
      columns: [
        { width: 'one-half', blocks: [amountField] },
        { width: 'one-half', blocks: [frequencyField] },
      ],
    }),
  ]
}
