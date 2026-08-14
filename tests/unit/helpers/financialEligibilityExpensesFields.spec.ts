import { expect } from 'chai';
import {
  mortgageField, mortgageFrequencyField,
  rentField, rentFrequencyField,
  maintenancePaidField, maintenancePaidFrequencyField,
  childcareCostsField, childcareCostsFrequencyField,
  legalAidContributionsField,
} from '#packages/financial-eligibility-journey/src/expensesPage/expensesBlock.js';
import {
  mortgagePartnerField, mortgagePartnerFrequencyField,
  rentPartnerField, rentPartnerFrequencyField,
  maintenancePaidPartnerField, maintenancePaidPartnerFrequencyField,
  childcareCostsPartnerField, childcareCostsPartnerFrequencyField,
  legalAidContributionsPartnerField,
} from '#packages/financial-eligibility-journey/src/partnerExpensesPage/partnerExpensesBlock.js';
import { frequencyItems as FREQUENCY_ITEMS } from '#packages/financial-eligibility-journey/src/moneyFieldHelpers.js';

interface FieldLike {
  code?: unknown;
  inputType?: unknown;
  defaultValue?: unknown;
  items?: unknown;
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

/**
 * Reads the `items` off a select field as a plain array of `{ value, text }` options.
 * @param {FieldLike} field The field to read options from
 * @returns {{ value: string; text: string }[]} The field's options, in order
 */
function selectItems(field: FieldLike): { value: string; text: string }[] {
  if (!Array.isArray(field.items)) {
    return [];
  }
  return field.items as { value: string; text: string }[];
}

interface MoneyFieldCase {
  name: string;
  code: string;
  amount: FieldLike;
  frequency: FieldLike;
  emptyMessage: string;
  invalidMessage: string;
  frequencyMessage: string;
}

const clientExpenseFields: MoneyFieldCase[] = [
  {
    name: 'mortgage', code: 'mortgage', amount: mortgageField, frequency: mortgageFrequencyField,
    emptyMessage: 'Enter how much you pay for your mortgage, or enter \'0\' if none',
    invalidMessage: 'How much you pay for your mortgage must be a positive number, like 1000 or 2400.50',
    frequencyMessage: 'Select the frequency for when you pay your mortgage',
  },
  {
    name: 'rent', code: 'rent', amount: rentField, frequency: rentFrequencyField,
    emptyMessage: 'Enter how much you pay for rent, or enter \'0\' if none',
    invalidMessage: 'How much you pay for rent must be a positive number, like 1000 or 2400.50',
    frequencyMessage: 'Select the frequency for when you pay rent',
  },
  {
    name: 'maintenance paid', code: 'maintenance-paid', amount: maintenancePaidField, frequency: maintenancePaidFrequencyField,
    emptyMessage: 'Enter how much maintenance you paid during the last calendar month, or enter \'0\' if none',
    invalidMessage: 'How much maintenance you paid during the last calendar month must be a positive number, like 100 or 240.50',
    frequencyMessage: 'Select the frequency for when you pay maintenance',
  },
  {
    name: 'childcare costs', code: 'childcare-costs', amount: childcareCostsField, frequency: childcareCostsFrequencyField,
    emptyMessage: 'Enter any childcare costs you have because of work or study, or enter \'0\' if none',
    invalidMessage: 'Any childcare costs you have because of work or study must be a positive number, like 100 or 240.50',
    frequencyMessage: 'Select the frequency for when you pay any childcare costs you have because of work or study',
  },
];

const partnerExpenseFields: MoneyFieldCase[] = [
  {
    name: 'mortgage', code: 'mortgage-partner', amount: mortgagePartnerField, frequency: mortgagePartnerFrequencyField,
    emptyMessage: 'Enter how much your partner pays for their mortgage, or enter \'0\' if none',
    invalidMessage: 'How much your partner pays for their mortgage must be a positive number, like 1000 or 2400.50',
    frequencyMessage: 'Select the frequency for when your partner pays their mortgage',
  },
  {
    name: 'rent', code: 'rent-partner', amount: rentPartnerField, frequency: rentPartnerFrequencyField,
    emptyMessage: 'Enter how much your partner pays for their rent, or enter \'0\' if none',
    invalidMessage: 'How much your partner pays for their rent must be a positive number, like 1000 or 2400.50',
    frequencyMessage: 'Select the frequency for when your partner pays rent',
  },
  {
    name: 'maintenance paid', code: 'maintenance-paid-partner', amount: maintenancePaidPartnerField, frequency: maintenancePaidPartnerFrequencyField,
    emptyMessage: 'Enter how much maintenance your partner paid during the last calendar month, or enter \'0\' if none',
    invalidMessage: 'How much maintenance your partner paid during the last calendar month must be a positive number, like 100 or 240.50',
    frequencyMessage: 'Select the frequency for when your partner pays maintenance',
  },
  {
    name: 'childcare costs', code: 'childcare-costs-partner', amount: childcareCostsPartnerField, frequency: childcareCostsPartnerFrequencyField,
    emptyMessage: 'Enter any childcare costs your partner has because of work or study, or enter \'0\' if none',
    invalidMessage: 'Any childcare costs your partner has because of work or study must be a positive number, like 100 or 240.50',
    frequencyMessage: 'Select the frequency for when your partner pays any childcare costs they have because of work or study',
  },
];

/**
 * Runs the shared set of assertions (AC6/AC7/AC8/AC10) against a money field + its paired frequency select
 * @param {MoneyFieldCase} testCase The field's expected code and messages
 * @returns {void}
 */
function testMoneyFieldPair(testCase: MoneyFieldCase): void {
  describe(`${testCase.name} field (${testCase.code})`, () => {
    it('uses a numeric text input with the correct code', () => {
      expect(testCase.amount.code).to.equal(testCase.code);
      expect(testCase.amount.inputType).to.equal('number');
    });

    it('requires the amount to be answered (AC6)', () => {
      expect(validationMessages(testCase.amount)[0]).to.equal(testCase.emptyMessage);
    });

    it('rejects negative or non-numeric amounts (AC8)', () => {
      expect(validationMessages(testCase.amount)[1]).to.equal(testCase.invalidMessage);
    });

    it('has exactly two validation rules on the amount field', () => {
      expect(validationMessages(testCase.amount)).to.have.length(2);
    });

    it('pairs with a frequency select defaulting to per_month with the standard options', () => {
      expect(testCase.frequency.code).to.equal(`${testCase.code}-frequency`);
      expect(testCase.frequency.defaultValue).to.equal('per_month');
      expect(selectItems(testCase.frequency)).to.deep.equal(FREQUENCY_ITEMS);
    });

    it('requires the frequency to be answered (AC10)', () => {
      expect(validationMessages(testCase.frequency)[0]).to.equal(testCase.frequencyMessage);
    });
  });
}

describe('Your expenses fields', () => {
  clientExpenseFields.forEach(testMoneyFieldPair);

  it('has no paired frequency field for legal aid contributions, and uses the exact ticket wording (AC6/AC8)', () => {
    expect(legalAidContributionsField.code).to.equal('legal-aid-contributions');
    expect(legalAidContributionsField.inputType).to.equal('number');
    expect(validationMessages(legalAidContributionsField)).to.have.length(2);
    expect(validationMessages(legalAidContributionsField)[0]).to.equal('Enter how much you paid towards legal aid for criminal defence in the last calendar month, or enter \'0\' if none');
    expect(validationMessages(legalAidContributionsField)[1]).to.equal('How much you paid towards legal aid for criminal defence in the last calendar month must be a number, like 100 or 240.50');
  });
});

describe('Your partner\'s expenses fields', () => {
  partnerExpenseFields.forEach(testMoneyFieldPair);

  it('has no paired frequency field for the partner\'s legal aid contributions, and uses the exact ticket wording (AC6/AC8)', () => {
    expect(legalAidContributionsPartnerField.code).to.equal('legal-aid-contributions-partner');
    expect(legalAidContributionsPartnerField.inputType).to.equal('number');
    expect(validationMessages(legalAidContributionsPartnerField)).to.have.length(2);
    expect(validationMessages(legalAidContributionsPartnerField)[0]).to.equal('Enter how much your partner paid towards legal aid for criminal defence in the last calendar month, or enter \'0\' if none');
    expect(validationMessages(legalAidContributionsPartnerField)[1]).to.equal('How much your partner paid towards legal aid for criminal defence in the last calendar month must be a number, like 100 or 240.50');
  });
});
