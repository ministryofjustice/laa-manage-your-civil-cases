import { expect } from 'chai';
import {
  bankBalanceField as savingsBankBalanceField,
  investmentBalanceField as savingsInvestmentBalanceField,
  assetBalanceField as savingsAssetBalanceField,
  creditBalanceField as savingsCreditBalanceField,
} from '#packages/financial-eligibility-journey/src/savingsPage/savingsBlock.js';
import {
  bankBalanceField as disputedBankBalanceField,
  investmentBalanceField as disputedInvestmentBalanceField,
  assetBalanceField as disputedAssetBalanceField,
  creditBalanceField as disputedCreditBalanceField,
} from '#packages/financial-eligibility-journey/src/disputedSavingsPage/disputedSavingsBlock.js';
import {
  bankBalanceField as partnerSavingsBankBalanceField,
  investmentBalanceField as partnerSavingsInvestmentBalanceField,
  assetBalanceField as partnerSavingsAssetBalanceField,
  creditBalanceField as partnerSavingsCreditBalanceField,
} from '#packages/financial-eligibility-journey/src/partnerSavingsPage/partnerSavingsBlock.js';
import {
  bankBalanceField as undisputedBankBalanceField,
  investmentBalanceField as undisputedInvestmentBalanceField,
  assetBalanceField as undisputedAssetBalanceField,
  creditBalanceField as undisputedCreditBalanceField,
} from '#packages/financial-eligibility-journey/src/undisputedSavings/undisputedSavingsBlock.js';
import {
  bankBalanceField as partnerUndisputedBankBalanceField,
  investmentBalanceField as partnerUndisputedInvestmentBalanceField,
  assetBalanceField as partnerUndisputedAssetBalanceField,
  creditBalanceField as partnerUndisputedCreditBalanceField,
} from '#packages/financial-eligibility-journey/src/partnerUndisputedSavings/partnerUndisputedSavingsBlock.js';
import { MAX_MONEY_VALUE_MESSAGE } from '#packages/financial-eligibility-journey/src/moneyFieldHelpers.js';

interface FieldLike {
  code?: unknown;
  inputType?: unknown;
  validWhen?: unknown;
}

/**
 * Reads the `message` off each `validWhen` rule on a field, in declaration order.
 * The Forge component types allow `validWhen` to be an expression/iterable as well as a plain
 * array, so this narrows it back down to the plain array shape used by every field in this file.
 * @param {FieldLike} field The field to read validation messages from
 * @returns {unknown[]} The `message` value of each validation rule, in order
 */
function validationMessages(field: FieldLike): unknown[] {
  if (!Array.isArray(field.validWhen)) {
    return [];
  }
  return field.validWhen.map((rule) => (rule as { message?: unknown }).message);
}

interface MoneyFieldCase {
  name: string;
  code: string;
  field: FieldLike;
  emptyMessage: string;
  invalidMessage: string;
}

/**
 * Runs the shared set of assertions against a savings money field: correct code/input type,
 * and the standard required/non-negative/max-value validation rules in order.
 * @param {MoneyFieldCase} testCase The field's expected code and messages
 * @returns {void}
 */
function testSavingsMoneyField(testCase: MoneyFieldCase): void {
  describe(`${testCase.name} field (${testCase.code})`, () => {
    it('uses a numeric text input with the correct code', () => {
      expect(testCase.field.code).to.equal(testCase.code);
      expect(testCase.field.inputType).to.equal('number');
    });

    it('requires the amount to be answered', () => {
      expect(validationMessages(testCase.field)[0]).to.equal(testCase.emptyMessage);
    });

    it('rejects negative amounts', () => {
      expect(validationMessages(testCase.field)[1]).to.equal(testCase.invalidMessage);
    });

    it('rejects amounts over the maximum allowed value', () => {
      expect(validationMessages(testCase.field)[2]).to.equal(MAX_MONEY_VALUE_MESSAGE);
    });

    it('has exactly three validation rules', () => {
      expect(validationMessages(testCase.field)).to.have.length(3);
    });
  });
}

describe('Your savings fields', () => {
  const cases: MoneyFieldCase[] = [
    {
      name: 'bank balance', code: 'bank-balance', field: savingsBankBalanceField,
      emptyMessage: 'Enter how much was in your bank account/building society before your last payment went in, or enter \'0\' if none',
      invalidMessage: 'How much was in your bank account/building society before your last payment went in must only include positive numbers, with or without a decimal point',
    },
    {
      name: 'investment balance', code: 'investment-balance', field: savingsInvestmentBalanceField,
      emptyMessage: 'Enter the value of any investments, shares or ISAs you have, or enter \'0\' if none',
      invalidMessage: 'The value of any investments, shares or ISAs you have must only include positive numbers, with or without a decimal point',
    },
    {
      name: 'asset balance', code: 'asset-balance', field: savingsAssetBalanceField,
      emptyMessage: 'Enter the value of any valuable items you have worth over £500 each, or enter \'0\' if none',
      invalidMessage: 'The value of valuable items worth over £500 each must only include positive numbers, with or without a decimal point',
    },
    {
      name: 'credit balance', code: 'credit-balance', field: savingsCreditBalanceField,
      emptyMessage: 'Enter the amount of any money owed to you, or enter \'0\' if none',
      invalidMessage: 'The amount of any money owed to you must only include positive numbers, with or without a decimal point',
    },
  ];

  cases.forEach(testSavingsMoneyField);
});

describe('Your disputed savings fields', () => {
  const cases: MoneyFieldCase[] = [
    {
      name: 'bank balance', code: 'bank-balance-disputed', field: disputedBankBalanceField,
      emptyMessage: 'Enter how much was in your bank account/building society before your last payment went in, or enter \'0\' if none',
      invalidMessage: 'How much was in your bank account/building society before your last payment went in must only include positive numbers, with or without a decimal point',
    },
    {
      name: 'investment balance', code: 'investment-balance-disputed', field: disputedInvestmentBalanceField,
      emptyMessage: 'Enter the value of any investments, shares or ISAs you have, or enter \'0\' if none',
      invalidMessage: 'The value of any investments, shares or ISAs you have must only include positive numbers, with or without a decimal point',
    },
    {
      name: 'asset balance', code: 'asset-balance-disputed', field: disputedAssetBalanceField,
      emptyMessage: 'Enter the value of any valuable items you have worth over £500 each, or enter \'0\' if none',
      invalidMessage: 'The value of valuable items worth over £500 each must only include positive numbers, with or without a decimal point',
    },
    {
      name: 'credit balance', code: 'credit-balance-disputed', field: disputedCreditBalanceField,
      emptyMessage: 'Enter the amount of any money owed to you, or enter \'0\' if none',
      invalidMessage: 'The amount of any money owed to you must only include positive numbers, with or without a decimal point',
    },
  ];

  cases.forEach(testSavingsMoneyField);
});

describe('Your partner\'s savings fields', () => {
  const cases: MoneyFieldCase[] = [
    {
      name: 'bank balance', code: 'bank-balance-partner', field: partnerSavingsBankBalanceField,
      emptyMessage: 'Enter how much was in your partner\'s bank account/building society before your last payment went in, or enter \'0\' if none',
      invalidMessage: 'How much was in your partner\'s bank account/building society before your last payment went in must only include positive numbers, with or without a decimal point',
    },
    {
      name: 'investment balance', code: 'investment-balance-partner', field: partnerSavingsInvestmentBalanceField,
      emptyMessage: 'Enter the value of any investments, shares or ISAs your partner has, or enter \'0\' if none',
      invalidMessage: 'The value of any investments, shares or ISAs your partner has must only include positive numbers, with or without a decimal point',
    },
    {
      name: 'asset balance', code: 'asset-balance-partner', field: partnerSavingsAssetBalanceField,
      emptyMessage: 'Enter the value of any valuable items your partner has worth over £500 each, or enter \'0\' if none',
      invalidMessage: 'The value of any valuable items your partner has worth over £500 each must only include positive numbers, with or without a decimal point',
    },
    {
      name: 'credit balance', code: 'credit-balance-partner', field: partnerSavingsCreditBalanceField,
      emptyMessage: 'Enter the amount of any money owed to your partner, or enter \'0\' if none',
      invalidMessage: 'The amount of any money owed to your partner must only include positive numbers, with or without a decimal point',
    },
  ];

  cases.forEach(testSavingsMoneyField);
});

describe('Your undisputed savings fields', () => {
  const cases: MoneyFieldCase[] = [
    {
      name: 'bank balance', code: 'bank-balance', field: undisputedBankBalanceField,
      emptyMessage: 'Enter how much was in your bank account/building society before your last payment went in, or enter \'0\' if none',
      invalidMessage: 'How much was in your bank account/building society before your last payment went in must only include positive numbers, with or without a decimal point',
    },
    {
      name: 'investment balance', code: 'investment-balance', field: undisputedInvestmentBalanceField,
      emptyMessage: 'Enter the value of any investments, shares or ISAs you have, or enter \'0\' if none',
      invalidMessage: 'The value of any investments, shares or ISAs you have must only include positive numbers, with or without a decimal point',
    },
    {
      name: 'asset balance', code: 'asset-balance', field: undisputedAssetBalanceField,
      emptyMessage: 'Enter the value of any valuable items you have worth over £500 each, or enter \'0\' if none',
      invalidMessage: 'The value of valuable items worth over £500 each must only include positive numbers, with or without a decimal point',
    },
    {
      name: 'credit balance', code: 'credit-balance', field: undisputedCreditBalanceField,
      emptyMessage: 'Enter the amount of any money owed to you, or enter \'0\' if none',
      invalidMessage: 'The amount of any money owed to you must only include positive numbers, with or without a decimal point',
    },
  ];

  cases.forEach(testSavingsMoneyField);
});

describe('Your partner\'s undisputed savings fields', () => {
  const cases: MoneyFieldCase[] = [
    {
      name: 'bank balance', code: 'bank-balance-partner', field: partnerUndisputedBankBalanceField,
      emptyMessage: 'Enter how much was in your partner\'s bank account/building society before your last payment went in, or enter \'0\' if none',
      invalidMessage: 'How much was in your partner\'s bank account/building society before your last payment went in must only include positive numbers, with or without a decimal point',
    },
    {
      name: 'investment balance', code: 'investment-balance-partner', field: partnerUndisputedInvestmentBalanceField,
      emptyMessage: 'Enter the value of any investments, shares or ISAs your partner has, or enter \'0\' if none',
      invalidMessage: 'The value of any investments, shares or ISAs your partner has must only include positive numbers, with or without a decimal point',
    },
    {
      name: 'asset balance', code: 'asset-balance-partner', field: partnerUndisputedAssetBalanceField,
      emptyMessage: 'Enter the value of any valuable items your partner has worth over £500 each, or enter \'0\' if none',
      invalidMessage: 'The value of valuable items worth over £500 each must only include positive numbers, with or without a decimal point',
    },
    {
      name: 'credit balance', code: 'credit-balance-partner', field: partnerUndisputedCreditBalanceField,
      emptyMessage: 'Enter the amount of any money owed to your partner, or enter \'0\' if none',
      invalidMessage: 'The amount of any money owed to your partner must only include positive numbers, with or without a decimal point',
    },
  ];

  cases.forEach(testSavingsMoneyField);
});
