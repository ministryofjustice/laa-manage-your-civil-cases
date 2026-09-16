import { expect } from 'chai';
import { Loop } from '@ministryofjustice/hmpps-forge/core/authoring';
import { propertyMarketValueField, propertyMortgageLeftField } from '#packages/financial-eligibility-journey/src/propertiesPage/propertiesBlock.js';
import {
  propertyMarketValueField as propertyMarketValueFieldPartner,
  propertyMortgageLeftField as propertyMortgageLeftFieldPartner,
} from '#packages/financial-eligibility-journey/src/propertiesPageWithPartner/propertiesBlockPartner.js';
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

interface BuiltExpression {
  build(): unknown;
}

interface FormatGeneratorExpr {
  name: string;
  arguments: [string, ...unknown[]];
}

/**
 * Resolves a value that may be an unfinalised builder (exposing `.build()`) or an already-plain
 * expression object, down to its plain expression shape.
 * @param {unknown} expr The builder or plain expression to normalise
 * @returns {unknown} The plain expression
 */
function toPlainExpr(expr: unknown): unknown {
  const maybeBuilder = expr as Partial<BuiltExpression>;
  return typeof maybeBuilder.build === 'function' ? maybeBuilder.build() : expr;
}

/**
 * Asserts that a validation message is built from `Format(expectedTemplate, Loop.Index())`, so the
 * error message shows the property's position (property 1, property 2, ...) rather than a fixed string.
 * @param {unknown} messageExpr The validation message expression to check
 * @param {string} expectedTemplate The exact `Format` template string expected
 * @returns {void}
 */
function expectUsesLoopIndex(messageExpr: unknown, expectedTemplate: string): void {
  const format = messageExpr as FormatGeneratorExpr;
  expect(format.name).to.equal('FormatString');
  expect(format.arguments[0]).to.equal(expectedTemplate);
  expect(toPlainExpr(format.arguments[1])).to.deep.equal(toPlainExpr(Loop.Index()));
}

/**
 * Asserts that a field's `code` is built from `Format(expectedTemplate, Loop.Index0())`, so each
 * property in the collection gets a unique, zero-indexed field code (e.g. `value_0`, `value_1`).
 * @param {unknown} codeExpr The field's `code` expression to check
 * @param {string} expectedTemplate The exact `Format` template string expected
 * @returns {void}
 */
function expectCodeUsesLoopIndex0(codeExpr: unknown, expectedTemplate: string): void {
  const format = codeExpr as FormatGeneratorExpr;
  expect(format.name).to.equal('FormatString');
  expect(format.arguments[0]).to.equal(expectedTemplate);
  expect(toPlainExpr(format.arguments[1])).to.deep.equal(toPlainExpr(Loop.Index0()));
}

interface PropertyFieldCase {
  name: string;
  codeTemplate: string;
  field: FieldLike;
  emptyMessageTemplate: string;
  invalidMessageTemplate: string;
}

/**
 * Runs the shared set of assertions against a property money field: correct code/input type,
 * and the standard required/non-negative/max-value validation rules in order, each using a
 * `Format(..., Loop.Index())` message so it references the correct property number.
 * @param {PropertyFieldCase} testCase The field's expected code and message templates
 * @returns {void}
 */
function testPropertyMoneyField(testCase: PropertyFieldCase): void {
  describe(`${testCase.name} field (${testCase.codeTemplate})`, () => {
    it('uses a numeric text input with a zero-indexed code', () => {
      expectCodeUsesLoopIndex0(testCase.field.code, testCase.codeTemplate);
      expect(testCase.field.inputType).to.equal('number');
    });

    it('requires the amount to be answered', () => {
      expectUsesLoopIndex(validationMessages(testCase.field)[0], testCase.emptyMessageTemplate);
    });

    it('rejects negative amounts', () => {
      expectUsesLoopIndex(validationMessages(testCase.field)[1], testCase.invalidMessageTemplate);
    });

    it('rejects amounts over the maximum allowed value', () => {
      expect(validationMessages(testCase.field)[2]).to.equal(MAX_MONEY_VALUE_MESSAGE);
    });

    it('has exactly three validation rules', () => {
      expect(validationMessages(testCase.field)).to.have.length(3);
    });
  });
}

describe('Property fields', () => {
  const cases: PropertyFieldCase[] = [
    {
      name: 'market value', codeTemplate: 'value_%1', field: propertyMarketValueField(),
      emptyMessageTemplate: 'Enter the current market value of property %1',
      invalidMessageTemplate: 'The current market value of property %1 must only include positive numbers, with or without a decimal point',
    },
    {
      name: 'mortgage left to pay', codeTemplate: 'mortgage-left_%1', field: propertyMortgageLeftField(),
      emptyMessageTemplate: 'Enter how much is left to pay on the mortgage for property %1, or enter \'0\' if there is nothing left to pay',
      invalidMessageTemplate: 'How much is left to pay on the mortgage for property %1 must only include positive numbers, with or without a decimal point',
    },
  ];

  cases.forEach(testPropertyMoneyField);
});

describe('Partner property fields', () => {
  const cases: PropertyFieldCase[] = [
    {
      name: 'market value', codeTemplate: 'value_%1', field: propertyMarketValueFieldPartner(),
      emptyMessageTemplate: 'Enter the current market value of property %1',
      invalidMessageTemplate: 'The current market value of property %1 must only include positive numbers, with or without a decimal point',
    },
    {
      name: 'mortgage left to pay', codeTemplate: 'mortgage-left_%1', field: propertyMortgageLeftFieldPartner(),
      emptyMessageTemplate: 'Enter how much is left to pay on the mortgage for property %1, or enter \'0\' if there is nothing left to pay',
      invalidMessageTemplate: 'How much is left to pay on the mortgage for property %1 must only include positive numbers, with or without a decimal point',
    },
  ];

  cases.forEach(testPropertyMoneyField);
});
