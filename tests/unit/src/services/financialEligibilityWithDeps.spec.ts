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

  describe('Property set mapping', () => {
    it('should map indexed property fields to property_set', () => {
      const answers = {
        'value_0': 350000,
        'mortgage-left_0': 125000,
        'disputed_0': 'yes',
        'main_0': 'no',
        'share_0': 50,
      };

      const result = mapAnswersToApiPayload(answers);
      expect(result.property_set).to.deep.equal([
        {
          value: 350000,
          mortgage_left: 125000,
          disputed: true,
          main: false,
          share: 50,
        }
      ]);
    });

    it('should map multiple indexed properties in index order', () => {
      const answers = {
        'value_1': 200000,
        'mortgage-left_1': 100000,
        'disputed_1': 'no',
        'main_1': 'yes',
        'share_1': 100,
        'value_0': 350000,
        'mortgage-left_0': 125000,
        'disputed_0': 'yes',
        'main_0': 'no',
        'share_0': 50,
      };

      const result = mapAnswersToApiPayload(answers);
      expect(result.property_set).to.deep.equal([
        {
          value: 350000,
          mortgage_left: 125000,
          disputed: true,
          main: false,
          share: 50,
        },
        {
          value: 200000,
          mortgage_left: 100000,
          disputed: false,
          main: true,
          share: 100,
        }
      ]);
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

  describe('Savings field mapping', () => {
    describe('Client savings (you.savings)', () => {
      it('should nest savings fields under `you.savings`', () => {
        const answers = { 'bank-balance': '56' };
        const result = mapAnswersToApiPayload(answers);

        expect(result.you).to.exist;
        expect((result.you as Record<string, unknown>).savings).to.exist;
      });

      it('should convert bank-balance pounds to pence under `you.savings`', () => {
        const answers = { 'bank-balance': '56' };
        const result = mapAnswersToApiPayload(answers);

        const savings = (result.you as Record<string, Record<string, unknown>>).savings;
        expect(savings.bank_balance).to.equal(5600);
      });

      it('should convert investment-balance pounds to pence under `you.savings`', () => {
        const answers = { 'investment-balance': '66' };
        const result = mapAnswersToApiPayload(answers);

        const savings = (result.you as Record<string, Record<string, unknown>>).savings;
        expect(savings.investment_balance).to.equal(6600);
      });

      it('should convert asset-balance pounds to pence under `you.savings`', () => {
        const answers = { 'asset-balance': '44' };
        const result = mapAnswersToApiPayload(answers);

        const savings = (result.you as Record<string, Record<string, unknown>>).savings;
        expect(savings.asset_balance).to.equal(4400);
      });

      it('should convert credit-balance pounds to pence under `you.savings`', () => {
        const answers = { 'credit-balance': '56' };
        const result = mapAnswersToApiPayload(answers);

        const savings = (result.you as Record<string, Record<string, unknown>>).savings;
        expect(savings.credit_balance).to.equal(5600);
      });

      it('should round fractional pence correctly', () => {
        const answers = { 'bank-balance': '12.505' };
        const result = mapAnswersToApiPayload(answers);

        const savings = (result.you as Record<string, Record<string, unknown>>).savings;
        expect(savings.bank_balance).to.equal(1251);
      });

      it('should not create `you.savings` when no savings fields are present', () => {
        const answers = { 'under-18': 'yes' };
        const result = mapAnswersToApiPayload(answers);

        expect(result.you).to.be.undefined;
      });

      it('should group all four savings fields together under `you.savings`', () => {
        const answers = {
          'bank-balance': '56',
          'investment-balance': '66',
          'asset-balance': '44',
          'credit-balance': '56',
        };
        const result = mapAnswersToApiPayload(answers);

        const savings = (result.you as Record<string, Record<string, unknown>>).savings;
        expect(savings).to.deep.equal({
          bank_balance: 5600,
          investment_balance: 6600,
          asset_balance: 4400,
          credit_balance: 5600,
        });
      });
    });

    describe('Partner savings (partner.savings)', () => {
      it('should nest partner savings fields under `partner.savings`', () => {
        const answers = { 'bank-balance-partner': '100' };
        const result = mapAnswersToApiPayload(answers);

        expect(result.partner).to.exist;
        expect((result.partner as Record<string, unknown>).savings).to.exist;
      });

      it('should convert bank-balance-partner pounds to pence under `partner.savings`', () => {
        const answers = { 'bank-balance-partner': '100' };
        const result = mapAnswersToApiPayload(answers);

        const savings = (result.partner as Record<string, Record<string, unknown>>).savings;
        expect(savings.bank_balance).to.equal(10000);
      });

      it('should convert all partner savings fields to pence under `partner.savings`', () => {
        const answers = {
          'bank-balance-partner': '10',
          'investment-balance-partner': '20',
          'asset-balance-partner': '30',
          'credit-balance-partner': '40',
        };
        const result = mapAnswersToApiPayload(answers);

        const savings = (result.partner as Record<string, Record<string, unknown>>).savings;
        expect(savings).to.deep.equal({
          bank_balance: 1000,
          investment_balance: 2000,
          asset_balance: 3000,
          credit_balance: 4000,
        });
      });

      it('should not create partner when no partner savings fields are present', () => {
        const answers = { 'bank-balance': '100' };
        const result = mapAnswersToApiPayload(answers);

        expect(result.partner).to.be.undefined;
      });

      it('should not mix partner savings into `you.savings`', () => {
        const answers = { 'bank-balance': '10', 'bank-balance-partner': '20' };
        const result = mapAnswersToApiPayload(answers);

        const clientSavings = (result.you as Record<string, Record<string, unknown>>).savings;
        const partnerSavings = (result.partner as Record<string, Record<string, unknown>>).savings;
        expect(clientSavings.bank_balance).to.equal(1000);
        expect(partnerSavings.bank_balance).to.equal(2000);
      });
    });

    describe('Disputed savings (disputed_savings)', () => {
      it('should nest disputed savings fields under disputed_savings', () => {
        const answers = { 'bank-balance-disputed': '75' };
        const result = mapAnswersToApiPayload(answers);

        expect(result.disputed_savings).to.exist;
      });

      it('should convert bank-balance-disputed pounds to pence under disputed_savings', () => {
        const answers = { 'bank-balance-disputed': '75' };
        const result = mapAnswersToApiPayload(answers);

        const savings = result.disputed_savings as Record<string, unknown>;
        expect(savings.bank_balance).to.equal(7500);
      });

      it('should convert all disputed savings fields to pence under disputed_savings', () => {
        const answers = {
          'bank-balance-disputed': '10',
          'investment-balance-disputed': '20',
          'asset-balance-disputed': '30',
          'credit-balance-disputed': '40',
        };
        const result = mapAnswersToApiPayload(answers);

        expect(result.disputed_savings).to.deep.equal({
          bank_balance: 1000,
          investment_balance: 2000,
          asset_balance: 3000,
          credit_balance: 4000,
        });
      });

      it('should not create disputed_savings when no disputed savings fields are present', () => {
        const answers = { 'bank-balance': '100' };
        const result = mapAnswersToApiPayload(answers);

        expect(result.disputed_savings).to.be.undefined;
      });

      it('should keep client, partner and disputed savings independent', () => {
        const answers = {
          'bank-balance': '10',
          'bank-balance-partner': '20',
          'bank-balance-disputed': '30',
        };
        const result = mapAnswersToApiPayload(answers);

        const clientSavings = (result.you as Record<string, Record<string, unknown>>).savings;
        const partnerSavings = (result.partner as Record<string, Record<string, unknown>>).savings;
        const disputedSavings = result.disputed_savings as Record<string, unknown>;
        expect(clientSavings.bank_balance).to.equal(1000);
        expect(partnerSavings.bank_balance).to.equal(2000);
        expect(disputedSavings.bank_balance).to.equal(3000);
      });
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
