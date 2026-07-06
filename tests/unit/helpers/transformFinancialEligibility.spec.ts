import { expect } from 'chai';
import * as sinon from 'sinon';
import { transformFinancialEligilibilityItem } from '#src/services/api/transforms/transformFinancialEligibility.js';
import en from '../../../locales/en.json' with { type: 'json' };
import { t } from '#src/scripts/helpers/index.js';
import { i18next } from '#src/scripts/helpers/i18nLoader.js';

describe('transformFinancialEligilibilityItem', () => {

  before(async () => {
    await i18next.init({
      lng: 'en',
      resources: {
        en
      }
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should throw when item is not an object', () => {
    expect(() =>
      transformFinancialEligilibilityItem(null)
    ).to.throw(
      'Invalid financial eligibility item: expected object'
    );
  });

  it('should transform details flags', () => {
    const result = transformFinancialEligilibilityItem({
      has_partner: true,
      is_you_under_18: true,
      is_you_or_your_partner_over_60: false
    });

    expect(result.hasPartner).to.equal(true);
    expect(result.isUnder17).to.equal(true);
    expect(result.isOver60).to.equal(false);
  });

  it('should transform dependant values', () => {
    const result = transformFinancialEligilibilityItem({
      dependants_young: 1,
      dependants_old: 2
    });

    expect(result.depedantsYoung).to.equal(1);
    expect(result.depedantsOld).to.equal(2);
  });

  it('should transform property set', () => {
    const result = transformFinancialEligilibilityItem({
      property_set: [
        {
          value: 100000,
          mortgage_left: 50000,
          share: 50,
          disputed: true,
          main: false
        }
      ]
    });

    expect(result.propertySet).to.deep.equal([
      {
        value: 1000, // Converted from pence to pounds
        mortgageLeft: 500, // Converted from pence to pounds
        share: 50,
        disputed: true,
        main: false
      }
    ]);
  });

  it('should convert savings from pence to pounds', () => {
    const result = transformFinancialEligilibilityItem({
      you: {
        savings: {
          bank_balance: 20000,
          investment_balance: 10000,
          asset_balance: 50000,
          credit_balance: 3000,
          total: 83000
        }
      }
    });

    expect(result.clientData.savings).to.deep.equal({
      bankBalance: 200,
      investmentBalance: 100,
      assetBalance: 500,
      creditBalance: 30,
      total: 830
    });
  });

  it('should transform benefits flags', () => {
    const result = transformFinancialEligilibilityItem({
      specific_benefits: {
        pension_credit: true,
        job_seekers_allowance: false,
        employment_support: true,
        universal_credit: false,
        income_support: true
      }
    });

    expect(result.specificBenefits).to.deep.equal({
      pensionCredit: true,
      jobSeekers: false,
      employmentSupport: true,
      universalCredit: false,
      incomeSupport: true
    });
  });

  it('should transform disregards', () => {
    const result = transformFinancialEligilibilityItem({
      disregards: {
        cost_living: true,
        vaccine_damage: false,
        criminal_injuries: true
      }
    });

    expect(result.disregards).to.deep.equal([
      t('common.financialDisregards.cost_living'),
      t('common.financialDisregards.criminal_injuries')
    ]);
  });

  it('should transform income values', () => {
    const result = transformFinancialEligilibilityItem({
      you: {
        income: {
          earnings: {
            per_interval_value: 15000,
            interval_period: "per_month"
          },
          self_employment_drawings: {
            per_interval_value: 20000,
            interval_period: "per_week"
          },
          benefits: {
            per_interval_value: 50000,
            interval_period: "per_year"
          },
          tax_credits: {
            per_interval_value: 10000,
            interval_period: "per_month"
          },
          child_benefits: {
            per_interval_value: 20000,
            interval_period: "per_month"
          },
          maintenance_received: {
            per_interval_value: 10000,
            interval_period: "per_month"
          },
          pension: {
            per_interval_value: 10000,
            interval_period: "per_month"
          },
          other_income: {
            per_interval_value: 0,
            interval_period: "per_month"
          },
          self_employed: false,
          total: 88749
        },
        savings: {
          bank_balance: 10000,
          investment_balance: 30000,
          asset_balance: 50000,
          credit_balance: 10000,
          total: 90000
        },
        deductions: {
          income_tax: {
            per_interval_value: 0,
            interval_period: "per_4week"
          },
          national_insurance: {
            per_interval_value: 0,
            interval_period: "per_2week"
          },
          maintenance: {
            per_interval_value: 2000,
            interval_period: "per_month"
          },
          childcare: {
            per_interval_value: 5000,
            interval_period: "per_month"
          },
          mortgage: {
            per_interval_value: 35000,
            interval_period: "per_month"
          },
          rent: {
            per_interval_value: 25000,
            interval_period: "per_month"
          },
          criminal_legalaid_contributions: 2000,
          total: 38000
        }
      }
    });

    expect(result.clientData.income.earnings)
      .to.deep.equal({
        amount: 150,
        time: 'per_month'
      });

    expect(result.clientData.income.selfEmployed)
      .to.equal(false);

    expect(result.clientData.income.total)
      .to.equal(887.49);
  });

  it('should return empty arrays when property_set is missing', () => {
    const result = transformFinancialEligilibilityItem({});

    expect(result.propertySet).to.deep.equal([]);
  });

  it('should transform partner data', () => {
    const result = transformFinancialEligilibilityItem({
      has_partner: true,
      partner: {
        savings: {
          bank_balance: 10000,
          investment_balance: 5000,
          asset_balance: 20000,
          credit_balance: 1000,
          total: 36000
        }
      }
    });

    expect(result.partnerData.partnerSavings).to.deep.equal({
      bankBalance: 100,
      investmentBalance: 50,
      assetBalance: 200,
      creditBalance: 10,
      total: 360
    });
  });

  it('should handle missing client data', () => {
    const result = transformFinancialEligilibilityItem({});

    expect(result.clientData.income).to.deep.equal({});
    expect(result.clientData.savings).to.deep.equal({});
    expect(result.clientData.deductions).to.deep.equal({});
  });


  it('should handle missing partner data', () => {
    const result = transformFinancialEligilibilityItem({
      has_partner: true
    });

    expect(result.partnerData.partnerIncome).to.deep.equal({});
    expect(result.partnerData.partnerSavings).to.deep.equal({});
    expect(result.partnerData.partnerDeductions).to.deep.equal({});
  });


  it('should return an empty disregards array when none are selected', () => {
    const result = transformFinancialEligilibilityItem({
      disregards: {
        cost_living: false,
        vaccine_damage: false
      }
    });

    expect(result.disregards).to.deep.equal([]);
  });


  it('should transform multiple properties', () => {
    const result = transformFinancialEligilibilityItem({
      property_set: [
        {
          value: 100000,
          mortgage_left: 50000,
          share: 50,
          disputed: true,
          main: false
        },
        {
          value: 200000,
          mortgage_left: 100000,
          share: 100,
          disputed: false,
          main: true
        }
      ]
    });

    expect(result.propertySet).to.have.length(2);
  });


  it('should transform deductions correctly', () => {
    const result = transformFinancialEligilibilityItem({
      you: {
        deductions: {
          income_tax: {
            per_interval_value: 1000,
            interval_period: 'per_month'
          },
          national_insurance: {
            per_interval_value: 500,
            interval_period: 'per_month'
          },
          criminal_legalaid_contributions: 2500,
          total: 4000
        }
      }
    });

    expect(result.clientData.deductions.incomeTax)
      .to.deep.equal({
        amount: 10,
        time: 'per_month'
      });

    expect(result.clientData.deductions.nationalInsurance)
      .to.deep.equal({
        amount: 5,
        time: 'per_month'
      });

    expect(result.clientData.deductions.criminalContributions)
      .to.deep.equal({
        amount: 25,
        time: 'per_month'
      });

    expect(result.clientData.deductions.total)
      .to.equal(40);
  });


  it('should default missing interval values to zero', () => {
    const result = transformFinancialEligilibilityItem({
      you: {
        income: {
          earnings: {
            interval_period: 'per_month'
          }
        }
      }
    });

    expect(result.clientData.income.earnings)
      .to.deep.equal({
        amount: 0,
        time: 'per_month'
      });
  });

  it('should default missing savings fields to zero', () => {
    const result = transformFinancialEligilibilityItem({
      you: {
        savings: {
          bank_balance: 10000
        }
      }
    });

    expect(result.clientData.savings).to.deep.equal({
      bankBalance: 100,
      investmentBalance: 0,
      assetBalance: 0,
      creditBalance: 0,
      total: 0
    });
  });
});