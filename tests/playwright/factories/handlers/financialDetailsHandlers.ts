/**
 * Personal Details endpoint handlers
 */

import { http, HttpResponse } from 'msw';

export function createFinancialEligibilityHandlers(
  API_BASE_URL: string,
  API_PREFIX: string,
) {
  return [
    http.get(
      `${API_BASE_URL}${API_PREFIX}/case/:caseReference/eligibility_check/`,
      ({ params }) => {
        const { caseReference } = params;

        if (caseReference === 'PC-1922-1879') {
          return HttpResponse.json({
            reference: 'bb071589c0254a0e939c4040d7a8a1bf',
            category: 'discrimination',
            property_set: [
              {
                value: 13000000,
                mortgage_left: 5000000,
                share: 100,
                id: 1361,
                disputed: false,
                main: false
              },
              {
                value: 12000000,
                mortgage_left: 6000000,
                share: 100,
                id: 1360,
                disputed: false,
                main: true
              }
            ],
            you: {
              income: {
                earnings: {
                  per_interval_value: 15000,
                  interval_period: "per_month"
                },
                self_employment_drawings: {
                  per_interval_value: 10000,
                  interval_period: "per_week"
                },
                benefits: {
                  per_interval_value: 5000,
                  interval_period: "per_year"
                },
                tax_credits: {
                  per_interval_value: 20000,
                  interval_period: "per_month"
                },
                child_benefits: {
                  per_interval_value: 10000,
                  interval_period: "per_month"
                },
                maintenance_received: {
                  per_interval_value: 0,
                  interval_period: "per_month"
                },
                pension: {
                  per_interval_value: 0,
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
                bank_balance: 20000,
                investment_balance: 10000,
                asset_balance: 50000,
                credit_balance: 20000,
                total: 100000
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
                  per_interval_value: 5000,
                  interval_period: "per_month"
                },
                childcare: {
                  per_interval_value: 2000,
                  interval_period: "per_month"
                },
                mortgage: {
                  per_interval_value: 20000,
                  interval_period: "per_month"
                },
                rent: {
                  per_interval_value: 10000,
                  interval_period: "per_month"
                },
                criminal_legalaid_contributions: 1000,
                total: 38000
              }
            },
            partner: {
              income: {},
              savings: {},
              deductions: {}
            },
            dependants_young: 0,
            dependants_old: 0,
            is_you_or_your_partner_over_60: false,
            has_partner: false,
            is_you_under_18: false,
            specific_benefits: {
              pension_credit: false,
              job_seekers_allowance: false,
              employment_support: false,
              universal_credit: false,
              income_support: false
            },
            disregards: {
              vaccine_damage: true,
              national_emergencies: true,
              vcjd_trust: true,
              infected_blood: true,
              child_maintenance: true,
              benefit_payments: true,
              child_abuse: true,
              grenfell_tower: true,
              london_emergencies: true,
              justice_compensation: true,
              love_manchester: true,
              overseas_terrorism: true,
              energy_prices: true,
              criminal_injuries: true,
              modern_slavery: true,
              cost_living: true
            }
          });
        }
        if (caseReference === 'PC-1869-9154') {
          console.log('MSW: returning financial eligibility for PC-1869-9154');
          return HttpResponse.json({
            reference: 'bb071589c0254a0e939c4040d7a8a1bf',
            category: 'discrimination',
            property_set: [
              {
                value: 15000000,
                mortgage_left: 6000000,
                share: 100,
                id: 1361,
                disputed: false,
                main: true
              }
            ],
            you: {
              income: {
                earnings: {
                  per_interval_value: 12000,
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
                  per_interval_value: 4000,
                  interval_period: "per_month"
                },
                childcare: {
                  per_interval_value: 3000,
                  interval_period: "per_month"
                },
                mortgage: {
                  per_interval_value: 30000,
                  interval_period: "per_month"
                },
                rent: {
                  per_interval_value: 20000,
                  interval_period: "per_month"
                },
                criminal_legalaid_contributions: 1000,
                total: 38000
              }
            },
             partner: {
              income: {
                earnings: {
                  per_interval_value: 13000,
                  interval_period: "per_month"
                },
                self_employment_drawings: {
                  per_interval_value: 10000,
                  interval_period: "per_week"
                },
                benefits: {
                  per_interval_value: 50000,
                  interval_period: "per_year"
                },
                tax_credits: {
                  per_interval_value: 20000,
                  interval_period: "per_month"
                },
                child_benefits: {
                  per_interval_value: 30000,
                  interval_period: "per_month"
                },
                maintenance_received: {
                  per_interval_value: 20000,
                  interval_period: "per_month"
                },
                pension: {
                  per_interval_value: 20000,
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
                bank_balance: 20000,
                investment_balance: 10000,
                asset_balance: 50000,
                credit_balance: 20000,
                total: 100000
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
                  per_interval_value: 4000,
                  interval_period: "per_month"
                },
                childcare: {
                  per_interval_value: 3000,
                  interval_period: "per_month"
                },
                mortgage: {
                  per_interval_value: 30000,
                  interval_period: "per_month"
                },
                rent: {
                  per_interval_value: 20000,
                  interval_period: "per_month"
                },
                criminal_legalaid_contributions: 1000,
                total: 38000
              }
            },
            dependants_young: 0,
            dependants_old: 0,
            is_you_or_your_partner_over_60: false,
            has_partner: true,
            is_you_under_18: false,
            specific_benefits: {
              pension_credit: false,
              job_seekers_allowance: false,
              employment_support: false,
              universal_credit: false,
              income_support: false
            },
            disregards: {
              cost_living: true
            }
          });
        }
        return HttpResponse.json(
          { error: 'Case not found' },
          { status: 404 }
        );
      }
    )
  ];
}