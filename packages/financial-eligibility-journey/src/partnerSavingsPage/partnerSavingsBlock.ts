import { Self, Condition, validation, Transformer } from '@ministryofjustice/hmpps-forge/core/authoring'
import { GovUKHeading, GovUKTextInput, GovUKUtilityClasses } from '@ministryofjustice/hmpps-forge/govuk-components'


export const partnerSavingsHeading = GovUKHeading({
  text: 'Your partner\'s savings',
  size: 'm',
})

export const bankBalanceField = GovUKTextInput({
  code: 'bank-balance-partner',
  label: 'How much was in your partner\'s bank account/building society before your last payment went in?',
  formatters: [Transformer.String.ToFloat()],
  prefix: { text: '£' },
  inputType: 'number',
  classes: GovUKUtilityClasses.Input.Width10,
  validWhen: [
    validation({
      condition: Self().match(Condition.IsRequired()),
      message: 'Enter how much was in your partner\'s bank account/building society before your last payment went in, or enter \'0\' if none',
    }),
    validation({
      condition: Self().match(Condition.Number.GreaterThanOrEqual(0)),
      message: 'How much was in your partner\'s bank account/building society before your last payment went in must only include positive numbers, with or without a decimal point',
    }),
  ],
})

export const investmentBalanceField = GovUKTextInput({
  code: 'investment-balance-partner',
  label: 'Does your partner have any investments, shares or ISAs?',
  formatters: [Transformer.String.ToFloat()],
  prefix: { text: '£' },
  inputType: 'number',
  classes: GovUKUtilityClasses.Input.Width10,
  validWhen: [
    validation({
      condition: Self().match(Condition.IsRequired()),
      message: 'Enter the value of any investments, shares or ISAs your partner has, or enter \'0\' if none',
    }),
    validation({
      condition: Self().match(Condition.Number.GreaterThanOrEqual(0)),
      message: 'The value of any investments, shares or ISAs your partner has must only include positive numbers, with or without a decimal point',
    }),
  ],
})

export const assetBalanceField = GovUKTextInput({
  code: 'asset-balance-partner',
  label: 'Does your partner have any valuable items worth over £500 each?',
  formatters: [Transformer.String.ToFloat()],
  prefix: { text: '£' },
  inputType: 'number',
  classes: GovUKUtilityClasses.Input.Width10,
  validWhen: [
    validation({
      condition: Self().match(Condition.IsRequired()),
      message: 'Enter the value of any valuable items your partner has worth over £500 each, or enter \'0\' if none',
    }),
    validation({
      condition: Self().match(Condition.Number.GreaterThanOrEqual(0)),
      message: 'The value of valuable items worth over £500 each must only include positive numbers, with or without a decimal point',
    }),
  ],
})

export const creditBalanceField = GovUKTextInput({
  code: 'credit-balance-partner',
  label: 'Does your partner have any money owed to them?',
  formatters: [Transformer.String.ToFloat()],
  prefix: { text: '£' },
  inputType: 'number',
  classes: GovUKUtilityClasses.Input.Width10,
  validWhen: [
    validation({
      condition: Self().match(Condition.IsRequired()),
      message: 'Enter the amount of any money owed to your partner, or enter \'0\' if none',
    }),
    validation({
      condition: Self().match(Condition.Number.GreaterThanOrEqual(0)),
      message: 'The amount of any money owed to your partner must only include positive numbers, with or without a decimal point',
    }),
  ],
})