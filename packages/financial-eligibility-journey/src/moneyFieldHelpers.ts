import { Self, Answer, Condition, validation, Transformer, Format, Generator } from '@ministryofjustice/hmpps-forge/core/authoring'
import type { ResolvableString } from '@ministryofjustice/hmpps-forge/core/components'
import { GovUKHeading, GovUKTextInput, GovUKSelectInput, GovUKUtilityClasses, GovUKGridRow } from '@ministryofjustice/hmpps-forge/govuk-components'

// The frequency a money field applies to. Defaults to 'per_month' when nothing has been entered yet.
// Single source of truth: also drives `frequencyText()` below, so a new frequency value only needs
// to be added here.
export const frequencyItems = [
  { value: 'per_week', text: 'Per week' },
  { value: 'per_2week', text: '2 weekly' },
  { value: 'per_4week', text: '4 weekly' },
  { value: 'per_month', text: 'Per month' },
  { value: 'per_year', text: 'Per year' },
]

/**
 * Formats a frequency answer for display, matching the frequency dropdown's own label text exactly
 * @param {string} frequencyCode The Forge answer code for the frequency select
 * @returns {unknown} The formatted frequency text
 */
export function frequencyText(frequencyCode: string) {
  return Answer(frequencyCode).pipe(
    ...frequencyItems.map((item) => Transformer.String.Replace(item.value, item.text)),
  )
}

export interface MoneyFieldConfig {
  code: string;
  label: ResolvableString;
  emptyMessage: string;
  invalidMessage: string;
  frequencyLabel: string;
  frequencyMessage: string;
  // Shown as a suffix on the amount field itself, for fields with no frequency dropdown (fixed at 'per_month')
  fixedFrequencySuffix?: string;
}

// Matches cla_backend's MoneyField/MoneyFieldDRF max_value of 9999999999 pence (see apps/legalaid/fields.py)
export const MAX_MONEY_VALUE = 99999999.99;
const MAX_MONEY_VALUE_FORMATTED = '99,999,999.99';

/**
 * Builds the max-value validation message from a field's invalidMessage, keeping the same subject
 * (e.g. "How much you pay for your mortgage") but swapping the ending for the max-value wording.
 * @param {string} invalidMessage The field's existing empty/negative-number validation message
 * @returns {string} The equivalent message for the max-value validation
 */
function maxValueMessage(invalidMessage: string): string {
  return invalidMessage.replace(/ must be a (positive )?number, like .+$/, ` must be ${MAX_MONEY_VALUE_FORMATTED} or less`)
}

/**
 * Computes 'one calendar month before today' as a Forge expression that is resolved fresh on every
 * render, matching the legacy cla_frontend calculation: today plus one day, then minus one month
 * (see PR #873). Used by the 'last calendar month' maintenance/legal aid contribution questions.
 * @returns {ResolvableString} A Forge expression resolving to a date like '20th July, 2026'
 */
export function lastCalendarMonthDate(): ResolvableString {
  return Generator.Date.Now().pipe(
    Transformer.Date.AddDays(1),
    Transformer.Date.AddMonths(-1),
    Transformer.Date.Format('Do MMMM, YYYY'),
  )
}

/**
 * Creates the amount input for a money field, shared across the income and expenses pages
 * @param {MoneyFieldConfig} config The field's code, label and validation messages
 * @returns {GovUKTextInput} The configured amount field
 */
export function createAmountField(config: MoneyFieldConfig) {
  return GovUKTextInput({
    code: config.code,
    label: { html: Format('Amount <span class="govuk-visually-hidden">for %1</span>', config.label) },
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
      validation({
        condition: Self().match(Condition.Number.LessThanOrEqual(MAX_MONEY_VALUE)),
        message: maxValueMessage(config.invalidMessage),
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
    label: { html: Format('Frequency <span class="govuk-visually-hidden">for %1</span>', config.label) },
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
