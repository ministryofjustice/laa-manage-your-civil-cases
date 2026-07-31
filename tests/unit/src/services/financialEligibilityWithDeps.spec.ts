/**
 * Unit tests for financialEligibilityWithDeps - mapAnswersToApiPayload function
 */

import { expect } from 'chai';
import { mapAnswersToApiPayload } from '#src/services/financialEligibilityWithDeps.js';

describe('mapAnswersToApiPayload', () => {
  describe('Basic mapping', () => {
    it('should map under-18 step code to `is_you_under_18 field`', () => {
      const answers = { 'under-18': 'yes' };
      const result = mapAnswersToApiPayload(answers);
      expect(result.is_you_under_18).to.equal(true);
    });

    it('should map under-18-receives-regular-payment step code to `under_18_receive_regular_payment` field', () => {
      const answers = { 'under-18-receives-regular-payment': 'no' };
      const result = mapAnswersToApiPayload(answers);
      expect(result.under_18_receive_regular_payment).to.equal(false);
    });

    it('should map under-18-has-valuables step code to `under_18_has_valuables` field', () => {
      const answers = { 'under-18-has-valuables': 'yes' };
      const result = mapAnswersToApiPayload(answers);
      expect(result.under_18_has_valuables).to.equal(true);
    });

    it('should map has-partner step code to `has_partner` field', () => {
      const answers = { 'has-partner': 'yes' };
      const result = mapAnswersToApiPayload(answers);
      expect(result.has_partner).to.equal(true);
    });

    it('should map 60-or-over step code to `is_you_or_your_partner_over_60` field', () => {
      const answers = { '60-or-over': 'no' };
      const result = mapAnswersToApiPayload(answers);
      expect(result.is_you_or_your_partner_over_60).to.equal(false);
    });

    it('should map 60-or-over-with-partner step code to `is_you_or_your_partner_over_60` field', () => {
      const answers = { '60-or-over-with-partner': 'yes' };
      const result = mapAnswersToApiPayload(answers);
      expect(result.is_you_or_your_partner_over_60).to.equal(true);
    });
  });

  describe('String to boolean conversion', () => {
    it('should convert "yes" string to true', () => {
      const answers = { 'under-18': 'yes' };
      const result = mapAnswersToApiPayload(answers);
      expect(result.is_you_under_18).to.equal(true);
    });

    it('should convert "no" string to false', () => {
      const answers = { 'under-18': 'no' };
      const result = mapAnswersToApiPayload(answers);
      expect(result.is_you_under_18).to.equal(false);
    });

    it('should convert "Yes" (uppercase) string to true', () => {
      const answers = { 'under-18': 'Yes' };
      const result = mapAnswersToApiPayload(answers);
      expect(result.is_you_under_18).to.equal(true);
    });

    it('should convert "NO" (uppercase) string to false', () => {
      const answers = { 'under-18': 'NO' };
      const result = mapAnswersToApiPayload(answers);
      expect(result.is_you_under_18).to.equal(false);
    });

    it('should convert "YeS" (mixed case) string to true', () => {
      const answers = { 'under-18': 'YeS' };
      const result = mapAnswersToApiPayload(answers);
      expect(result.is_you_under_18).to.equal(true);
    });

    it('should keep non-yes/no string values as-is', () => {
      const answers = { 'under-18': 'maybe' };
      const result = mapAnswersToApiPayload(answers);
      expect(result.is_you_under_18).to.equal('maybe');
    });

    it('should keep boolean values as-is', () => {
      const answers = { 'under-18': true };
      const result = mapAnswersToApiPayload(answers);
      expect(result.is_you_under_18).to.equal(true);
    });
  });

  describe('Benefits field grouping', () => {
    it('should group universal-credit into `specific_benefits`', () => {
      const answers = { 'universal-credit': 'yes'};
      const result = mapAnswersToApiPayload(answers);

      expect(result.specific_benefits).to.exist;
      expect((result.specific_benefits as Record<string, unknown>).universal_credit).to.equal(true);
      expect(result.universal_credit).to.be.undefined;
    });

    it('should group income-support into `specific_benefits`', () => {
      const answers = { 'income-support': 'yes' };
      const result = mapAnswersToApiPayload(answers);

      expect(result.specific_benefits).to.exist;
      expect((result.specific_benefits as Record<string, unknown>).income_support).to.equal(true);
    });

    it('should group income-based-jsa into `specific_benefits` as `job_seekers_allowance`', () => {
      const answers = { 'income-based-jsa': 'yes' };
      const result = mapAnswersToApiPayload(answers);

      expect(result.specific_benefits).to.exist;
      expect((result.specific_benefits as Record<string, unknown>).job_seekers_allowance).to.equal(true);
    });

    it('should group pension-credit into `specific_benefits`', () => {
      const answers = { 'pension-credit': 'no' };
      const result = mapAnswersToApiPayload(answers);

      expect(result.specific_benefits).to.exist;
      expect((result.specific_benefits as Record<string, unknown>).pension_credit).to.equal(false);
    });

    it('should group employment-support into `specific_benefits`', () => {
      const answers = { 'employment-support': 'yes' };
      const result = mapAnswersToApiPayload(answers);

      expect(result.specific_benefits).to.exist;
      expect((result.specific_benefits as Record<string, unknown>).employment_support).to.equal(true);
    });

    it('should group multiple benefit fields into specific_benefits', () => {
      const answers = {
        'universal-credit': 'yes',
        'income-support': 'no',
        'pension-credit': 'yes'
      };
      const result = mapAnswersToApiPayload(answers);

      expect(result.specific_benefits).to.exist;
      const benefits = result.specific_benefits as Record<string, unknown>;
      expect(benefits.universal_credit).to.equal(true);
      expect(benefits.income_support).to.equal(false);
      expect(benefits.pension_credit).to.equal(true);
    });

    it('should not create specific_benefits when no benefit fields are present', () => {
      const answers = {
        'under-18': 'yes',
        'partner': 'no'
      };
      const result = mapAnswersToApiPayload(answers);

      expect(result.specific_benefits).to.be.undefined;
    });
  });

  describe('`under_18_passported` calculation', () => {
    it('should set `under_18_passported` to `true` when under 18, no regular payment, and no valuables', () => {
      const answers = {
        'under-18': 'yes',
        'under-18-receives-regular-payment': 'no',
        'under-18-has-valuables': 'no'
      };
      const result = mapAnswersToApiPayload(answers);

      expect(result.under_18_passported).to.equal(true);
    });

    it('should set under_18_passported to false when under 18 but has regular payment', () => {
      const answers = {
        'under-18': 'yes',
        'under-18-receives-regular-payment': 'yes',
        'under-18-has-valuables': 'no'
      };
      const result = mapAnswersToApiPayload(answers);

      expect(result.under_18_passported).to.equal(false);
    });

    it('should set under_18_passported to false when under 18 but has valuables', () => {
      const answers = {
        'under-18': 'yes',
        'under-18-receives-regular-payment': 'no',
        'under-18-has-valuables': 'yes'
      };
      const result = mapAnswersToApiPayload(answers);

      expect(result.under_18_passported).to.equal(false);
    });

    it('should set under_18_passported to false when under 18 but has both regular payment and valuables', () => {
      const answers = {
        'under-18': 'yes',
        'under-18-receives-regular-payment': 'yes',
        'under-18-has-valuables': 'yes'
      };
      const result = mapAnswersToApiPayload(answers);

      expect(result.under_18_passported).to.equal(false);
    });

    it('should set under_18_passported to false when not under 18', () => {
      const answers = {
        'under-18': 'no',
        'under-18-receives-regular-payment': 'no',
        'under-18-has-valuables': 'no'
      };
      const result = mapAnswersToApiPayload(answers);

      expect(result.under_18_passported).to.equal(false);
    });

    it('should set under_18_passported to false when under_18 is not answered', () => {
      const answers = {
        'under-18-receives-regular-payment': 'no',
        'under-18-has-valuables': 'no'
      };
      const result = mapAnswersToApiPayload(answers);

      expect(result.under_18_passported).to.equal(false);
    });
  });

  describe('Complete payload mapping', () => {
    it('should map a complete set of answers correctly', () => {
      const answers = {
        'under-18': 'yes',
        'under-18-receives-regular-payment': 'no',
        'under-18-has-valuables': 'no',
        'has-partner': 'no',
        '60-or-over': 'no',
        'universal-credit': 'yes',
        'income-support': 'no',
        'income-based-jsa': 'no',
        'pension-credit': 'no',
        'employment-support': 'yes'
      };
      const result = mapAnswersToApiPayload(answers);

      expect(result.is_you_under_18).to.equal(true);
      expect(result.under_18_receive_regular_payment).to.equal(false);
      expect(result.under_18_has_valuables).to.equal(false);
      expect(result.has_partner).to.equal(false);
      expect(result.is_you_or_your_partner_over_60).to.equal(false);
      expect(result.under_18_passported).to.equal(true);
      
      expect(result.specific_benefits).to.exist;
      const benefits = result.specific_benefits as Record<string, unknown>;
      expect(benefits.universal_credit).to.equal(true);
      expect(benefits.income_support).to.equal(false);
      expect(benefits.job_seekers_allowance).to.equal(false);
      expect(benefits.pension_credit).to.equal(false);
      expect(benefits.employment_support).to.equal(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty answers object', () => {
      const answers = {};
      const result = mapAnswersToApiPayload(answers);

      expect(result.under_18_passported).to.equal(false);
      expect(result.specific_benefits).to.be.undefined;
    });

    it('should ignore unmapped step codes', () => {
      const answers = {
        'unknown-field': 'value',
        'another-unknown': 'test'
      };
      const result = mapAnswersToApiPayload(answers);

      expect(result.unknown_field).to.be.undefined;
      expect(result.another_unknown).to.be.undefined;
      expect(result.under_18_passported).to.equal(false);
    });

    it('should handle null values', () => {
      const answers = { 'under-18': null };
      const result = mapAnswersToApiPayload(answers);
      expect(result.is_you_under_18).to.equal(null);
    });

    it('should handle undefined values', () => {
      const answers = { 'under-18': undefined };
      const result = mapAnswersToApiPayload(answers);
      expect(result.is_you_under_18).to.equal(undefined);
    });
  });
});
