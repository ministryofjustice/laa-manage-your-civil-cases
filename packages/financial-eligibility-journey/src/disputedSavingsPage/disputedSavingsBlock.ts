import { Self, Condition, validation, Transformer } from '@ministryofjustice/hmpps-forge/core/authoring'
import { GovUKHeading, GovUKTextInput, GovUKUtilityClasses } from '@ministryofjustice/hmpps-forge/govuk-components'

export const disputedSavingsHeading = GovUKHeading({
  text: 'Your disputed savings',
  size: 'm',
})

export const bankBalanceField = GovUKTextInput({
  code: 'bank-balance-disputed',
  label: 'How much was in your bank account/building society before your last payment went in?',
  formatters: [Transformer.String.ToFloat()],
  prefix: { text: '£' },
  inputType: 'number',
  classes: GovUKUtilityClasses.Input.Width10,
  validWhen: [
    validation({
      condition: Self().match(Condition.IsRequired()),
      message: 'Enter how much was in your bank account/building society before your last payment went in, or enter \'0\' if none',
    }),
    validation({
      condition: Self().match(Condition.Number.IsNumber()),
      message: 'How much was in your bank account/building society before your last payment went in must be a number, like 100 or 240.50',
    }),
    validation({
      condition: Self().match(Condition.Number.GreaterThanOrEqual(0)),
      message: 'How much was in your bank account/building society before your last payment went in must only include numbers, with or without a decimal point',
    }),
  ],
})

export const investmentBalanceField = GovUKTextInput({
  code: 'investment-balance-disputed',
  label: 'Do you have any investments, shares or ISAs?',
  formatters: [Transformer.String.ToFloat()],
  prefix: { text: '£' },
  inputType: 'number',
  classes: GovUKUtilityClasses.Input.Width10,
  validWhen: [
    validation({
      condition: Self().match(Condition.IsRequired()),
      message: 'Enter the value of any investments, shares or ISAs you have, or enter \'0\' if none',
    }),
    validation({
      condition: Self().match(Condition.Number.IsNumber()),
      message: 'The value of any investments, shares or ISAs you have must be a number, like 100 or 240.50',
    }),
    validation({
      condition: Self().match(Condition.Number.GreaterThanOrEqual(0)),
      message: 'The value of any investments, shares or ISAs you have must only include numbers, with or without a decimal point',
    }),
  ],
})

export const assetBalanceField = GovUKTextInput({
  code: 'asset-balance-disputed',
  label: 'Do you have any valuable items worth over £500 each?',
  formatters: [Transformer.String.ToFloat()],
  prefix: { text: '£' },
  inputType: 'number',
  classes: GovUKUtilityClasses.Input.Width10,
  validWhen: [
    validation({
      condition: Self().match(Condition.IsRequired()),
      message: 'Enter the value of any valuable items you have worth over £500 each, or enter \'0\' if none',
    }),
    validation({
      condition: Self().match(Condition.Number.IsNumber()),
      message: 'The value of any valuable items you have worth over £500 each must be a number, like 100 or 240.50',
    }),
    validation({
      condition: Self().match(Condition.Number.GreaterThanOrEqual(0)),
      message: 'The value of valuable items worth over £500 each must only include numbers, with or without a decimal point',
    }),
  ],
})

export const creditBalanceField = GovUKTextInput({
  code: 'credit-balance-disputed',
  label: 'Do you have any money owed to you?',
  formatters: [Transformer.String.ToFloat()],
  prefix: { text: '£' },
  inputType: 'number',
  classes: GovUKUtilityClasses.Input.Width10,
  validWhen: [
    validation({
      condition: Self().match(Condition.IsRequired()),
      message: 'Enter the amount of any money owed to you, or enter \'0\' if none',
    }),
    validation({
      condition: Self().match(Condition.Number.IsNumber()),
      message: 'The amount of any money owed to you must be a number, like 100 or 240.50',
    }),
    validation({
      condition: Self().match(Condition.Number.GreaterThanOrEqual(0)),
      message: 'The amount of any money owed to you must only include numbers, with or without a decimal point',
    }),
  ],
})