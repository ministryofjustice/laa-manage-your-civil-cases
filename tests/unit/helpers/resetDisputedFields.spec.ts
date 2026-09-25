import { expect } from 'chai';
import type { Request } from 'express';
import * as sinon from 'sinon';

import { apiService } from '#src/services/apiService.js';
import { resetDisputedFieldData } from '#src/scripts/helpers/resetDisputedFields.js';
import type {
  FinancialEligibilityData,
  MoneyPerInterval
} from '#types/api-types.js';

describe('resetDisputedFieldData', () => {
  const caseReference = 'AA-1234-5678';

  const mockReq = {
    axiosMiddleware: {}
  } as Request;

  const emptyMoneyPerInterval: MoneyPerInterval = {
    amount: null,
    time: null
  };

  const financialEligibilityData: FinancialEligibilityData = {
    hasPartner: false,
    isUnder17: false,
    isOver60: false,

    specificBenefits: {
      pensionCredit: false,
      jobSeekers: false,
      employmentSupport: false,
      universalCredit: false,
      incomeSupport: false
    },

    propertySet: [
      {
        value: 1000,
        mortgageLeft: 500,
        share: 50,
        disputed: true,
        main: true
      },
      {
        value: 2000,
        mortgageLeft: 1000,
        share: 25,
        disputed: false,
        main: false
      }
    ],

    clientData: {
      income: {
        earnings: emptyMoneyPerInterval,
        selfEmploymentDrawings: emptyMoneyPerInterval,
        benefits: emptyMoneyPerInterval,
        taxCredits: emptyMoneyPerInterval,
        childBenefit: emptyMoneyPerInterval,
        maintenanceReceived: emptyMoneyPerInterval,
        pension: emptyMoneyPerInterval,
        otherIncome: emptyMoneyPerInterval,
        selfEmployed: false,
        total: 0
      },
      savings: {
        bankBalance: 100,
        investmentBalance: 200,
        assetBalance: 300,
        creditBalance: 400,
        total: 1000
      },
      deductions: {
        incomeTax: emptyMoneyPerInterval,
        nationalInsurance: emptyMoneyPerInterval,
        maintenance: emptyMoneyPerInterval,
        childcare: emptyMoneyPerInterval,
        mortgage: emptyMoneyPerInterval,
        rent: emptyMoneyPerInterval,
        criminalContributions: emptyMoneyPerInterval,
        total: 0
      }
    },

    partnerData: {
      partnerIncome: {
        earnings: emptyMoneyPerInterval,
        selfEmploymentDrawings: emptyMoneyPerInterval,
        benefits: emptyMoneyPerInterval,
        taxCredits: emptyMoneyPerInterval,
        childBenefit: emptyMoneyPerInterval,
        maintenanceReceived: emptyMoneyPerInterval,
        pension: emptyMoneyPerInterval,
        otherIncome: emptyMoneyPerInterval,
        selfEmployed: false,
        total: 0
      },
      partnerSavings: null,
      partnerDeductions: {
        incomeTax: emptyMoneyPerInterval,
        nationalInsurance: emptyMoneyPerInterval,
        maintenance: emptyMoneyPerInterval,
        childcare: emptyMoneyPerInterval,
        mortgage: emptyMoneyPerInterval,
        rent: emptyMoneyPerInterval,
        criminalContributions: emptyMoneyPerInterval,
        total: 0
      }
    },

    disputedSavings: {
      bankBalance: 10000,
      investmentBalance: 20000,
      assetBalance: 30000,
      creditBalance: 40000,
      total: 100000
    },

    disregards: [],
    dependantsYoung: 0,
    dependantsOld: 0,
    state: 'no',
    hasPassportedProceedingsLetter: false,
    passportedBenefits: false,
    under18passportedBenefits: false,
    category: 'education'
  };

  afterEach(() => {
    sinon.restore();
  });

  it('should clear disputed savings and property disputes', async () => {
    sinon.stub(apiService, 'getFinancialEligibility').resolves({
      status: 'success',
      data: financialEligibilityData
    });

    const updateStub = sinon.stub(apiService, 'updateFinancialEligibility').resolves({
      status: 'success',
      data: financialEligibilityData
    });

    await resetDisputedFieldData(
      mockReq,
      caseReference
    );

    expect(updateStub.calledOnce).to.equal(true);

    expect(
      updateStub.calledWith(
        mockReq.axiosMiddleware,
        caseReference,
        sinon.match.object
      )
    ).to.equal(true);

    const payload = updateStub.firstCall.args[2] as unknown as Record<string, unknown>;

    expect(payload.disputed_savings).to.deep.equal({
      bank_balance: null,
      investment_balance: null,
      asset_balance: null,
      credit_balance: null
    });

    expect(payload.property_set).to.deep.equal([
      {
        value: 100000,
        mortgage_left: 50000,
        share: 50,
        disputed: false,
        main: true
      },
      {
        value: 200000,
        mortgage_left: 100000,
        share: 25,
        disputed: false,
        main: false
      }
    ]);
  });

  it('should handle an empty property set', async () => {
    const dataWithNoProperties: FinancialEligibilityData = {
      ...financialEligibilityData,
      propertySet: []
    };

    sinon.stub(apiService, 'getFinancialEligibility').resolves({
      status: 'success',
      data: dataWithNoProperties
    });

    const updateStub = sinon.stub(apiService, 'updateFinancialEligibility').resolves({
      status: 'success',
      data: dataWithNoProperties
    });

    await resetDisputedFieldData(mockReq, caseReference);

    expect(updateStub.calledOnce).to.equal(true);

    const payload = updateStub.firstCall.args[2] as unknown as Record<string, unknown>;

    expect(payload.disputed_savings).to.deep.equal({
      bank_balance: null,
      investment_balance: null,
      asset_balance: null,
      credit_balance: null
    });

    expect(payload.property_set).to.deep.equal([]);
  });

  it('should throw the API message when retrieval fails', async () => {
    sinon.stub(apiService, 'getFinancialEligibility').resolves({
      status: 'error',
      message: 'Backend unavailable',
      data: null
    });

    try {
      await resetDisputedFieldData(mockReq, caseReference);

      expect.fail('Expected resetDisputedFieldData to throw');
    } catch(error) {
      expect((error as Error).message).to.equal(
        'Backend unavailable'
      );
    }

    expect(
      (apiService.updateFinancialEligibility as sinon.SinonStub)
        ?.called
    ).not.to.equal(true);
  });

  it('should throw the fallback error when retrieval returns no data', async () => {
    sinon.stub(apiService, 'getFinancialEligibility').resolves({
      status: 'success',
      data: null
    });

    try {
      await resetDisputedFieldData(mockReq, caseReference);

      expect.fail('Expected resetDisputedFieldData to throw');
    } catch(error) {
      expect((error as Error).message).to.equal(
        'Failed to retrieve financial eligibility'
      );
    }
  });

  it('should throw the API message when the update fails', async () => {
    sinon.stub(apiService, 'getFinancialEligibility').resolves({
      status: 'success',
      data: financialEligibilityData
    });

    sinon.stub(apiService, 'updateFinancialEligibility').resolves({
      status: 'error',
      message: 'Update failed',
      data: null
    });

    try {
      await resetDisputedFieldData(mockReq, caseReference);

      expect.fail('Expected resetDisputedFieldData to throw');
    } catch(error) {
      expect((error as Error).message).to.equal(
        'Update failed'
      );
    }
  });

  it('should throw the fallback error when the update fails without a message', async () => {
    sinon.stub(apiService, 'getFinancialEligibility').resolves({
      status: 'success',
      data: financialEligibilityData
    });

    sinon.stub(apiService, 'updateFinancialEligibility').resolves({
      status: 'error',
      data: null
    });

    try {
      await resetDisputedFieldData(mockReq, caseReference);

      expect.fail('Expected resetDisputedFieldData to throw');
    } catch(error) {
      expect((error as Error).message).to.equal(
        'Failed to reset disputed financial eligibility fields'
      );
    }
  });
});