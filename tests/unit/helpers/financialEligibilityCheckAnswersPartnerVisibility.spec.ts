import { expect } from 'chai';
import sinon from 'sinon';
import { createTestEffectContext } from '@ministryofjustice/hmpps-forge/core/testing';
import { ExpressionType } from '@ministryofjustice/hmpps-forge/core/authoring';
import type { PredicateExpr, ReferenceExpr } from '@ministryofjustice/hmpps-forge/core/authoring';
import { aboutYouSummaryList } from '#packages/financial-eligibility-journey/src/checkAnswersPage/checkAnswersBlock.js';
import type { Deps } from '#packages/financial-eligibility-journey/src/api.js';
import { FinancialEligibilityEffectsWithDepsImpl } from '#src/services/financialEligibilityWithDeps.js';

/**
 * Collects the `answers.*` paths referenced by every `Answer(...).match(...)` test
 * nested anywhere within a predicate tree (AND/OR/XOR/NOT), regardless of nesting depth.
 * @param {PredicateExpr} predicate The predicate expression to walk
 * @returns {string[]} The dotted answer paths referenced by the predicate
 */
function referencedAnswerPaths(predicate: PredicateExpr): string[] {
  // PredicateType is a TS-only enum (not exported at runtime), so its string values are used directly
  if (predicate.type === 'PredicateType.Test') {
    const subject = predicate.subject as ReferenceExpr;
    if (subject.type === ExpressionType.REFERENCE && subject.path[0] === 'answers') {
      return [subject.path.slice(1).join('.')];
    }
    return [];
  }
  if (predicate.type === 'PredicateType.Not') {
    return referencedAnswerPaths(predicate.operand);
  }
  return predicate.operands.flatMap(referencedAnswerPaths);
}

function partnerRowVisibleWhen(): PredicateExpr {
  const partnerRow = aboutYouSummaryList.rows.find((row) => row.key.text === 'Do you have a partner?');
  if (!partnerRow?.visibleWhen) {
    throw new Error('Expected the "Do you have a partner?" row to have a visibleWhen predicate');
  }
  return partnerRow.visibleWhen as PredicateExpr;
}

describe('Check your answers: "Do you have a partner?" row visibility', () => {
  it('checks the actual under-18 answer, not just its follow-up sub-answers', () => {
    // Regression guard for EL-3460: the row was previously hidden for any adult whose
    // under-18-only follow-up answers defaulted to "no", because the predicate never
    // looked at the "under-18" answer itself.
    expect(referencedAnswerPaths(partnerRowVisibleWhen())).to.include('under-18');
  });

  describe('LoadCaseFinancialEligibility scenarios', () => {
    const deps = {} as Deps;
    let getFinancialEligibilityStub: sinon.SinonStub;
    let effects: FinancialEligibilityEffectsWithDepsImpl;

    beforeEach(() => {
      getFinancialEligibilityStub = sinon.stub();
      effects = new FinancialEligibilityEffectsWithDepsImpl({
        getFinancialEligibility: getFinancialEligibilityStub,
        updateFinancialEligibility: sinon.stub(),
      });
    });

    afterEach(() => {
      sinon.restore();
    });

    it('shows the partner row for an adult whose under-18 branch was never answered', async () => {
      // Real case WE-5647-7943: is_you_under_18/under_18_receive_regular_payment/under_18_has_valuables all null
      const context = createTestEffectContext({ params: { caseReference: 'CASE1' }, session: {} });
      getFinancialEligibilityStub.resolves({
        data: {
          hasPartner: false,
          isUnder17: null,
          isOver60: null,
          specificBenefits: {},
          under18RegularPayment: null,
          under18HasValuables: null,
          propertySet: [],
          clientData: {},
          partnerData: {},
          disputedSavings: null,
          disregards: [],
        },
      });

      await effects.LoadCaseFinancialEligibility(deps, context);

      expect(context.getAnswer('under-18')).to.equal('no');
      expect(context.getAnswer('under-18-receives-regular-payment')).to.equal('no');
      expect(context.getAnswer('under-18-has-valuables')).to.equal('no');
    });

    it('hides the partner row for a client who is genuinely under-18 passported', async () => {
      const context = createTestEffectContext({ params: { caseReference: 'CASE2' }, session: {} });
      getFinancialEligibilityStub.resolves({
        data: {
          hasPartner: false,
          isUnder17: true,
          isOver60: false,
          specificBenefits: {},
          under18RegularPayment: false,
          under18HasValuables: false,
          propertySet: [],
          clientData: {},
          partnerData: {},
          disputedSavings: null,
          disregards: [],
        },
      });

      await effects.LoadCaseFinancialEligibility(deps, context);

      expect(context.getAnswer('under-18')).to.equal('yes');
      expect(context.getAnswer('under-18-receives-regular-payment')).to.equal('no');
      expect(context.getAnswer('under-18-has-valuables')).to.equal('no');
    });
  });
});
