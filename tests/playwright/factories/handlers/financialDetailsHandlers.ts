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
                  interval_period: 'per_month'
                },
                self_employed: false
              },

              savings: {
                bank_balance: 20000,
                investment_balance: 10000,
                asset_balance: 50000,
                credit_balance: 20000,
                total: 100000
              },

              deductions: {
                mortgage: {
                  per_interval_value: 20000,
                  interval_period: 'per_month'
                }
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

        return HttpResponse.json(
          { error: 'Case not found' },
          { status: 404 }
        );
      }
    )
  ];
}

