/**
 * Unit tests for financialEligibilityWithDeps - mapAnswersToApiPayload function and
 * the FinancialEligibilityEffectsWithDepsImpl class
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { createTestEffectContext } from '@ministryofjustice/hmpps-forge/core/testing';
import type { Deps } from '#packages/financial-eligibility-journey/src/api.js';
import type { FinancialEligibilitySession } from '#packages/financial-eligibility-journey/src/context.type.js';
import { mapAnswersToApiPayload, FinancialEligibilityEffectsWithDepsImpl } from '#src/services/financialEligibilityWithDeps.js';

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

// getSession() is typed to allow undefined, but the seed helper always defaults session to {}, so force it directly
function withNoSession(context: ReturnType<typeof createTestEffectContext>): void {
  sinon.stub(context, 'getSession').returns(undefined);
}

describe('FinancialEligibilityEffectsWithDepsImpl', () => {
  const deps = {} as Deps;
  let getFinancialEligibilityStub: sinon.SinonStub;
  let updateFinancialEligibilityStub: sinon.SinonStub;
  let effects: FinancialEligibilityEffectsWithDepsImpl;

  beforeEach(() => {
    getFinancialEligibilityStub = sinon.stub();
    updateFinancialEligibilityStub = sinon.stub();
    effects = new FinancialEligibilityEffectsWithDepsImpl({
      getFinancialEligibility: getFinancialEligibilityStub,
      updateFinancialEligibility: updateFinancialEligibilityStub
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('LoadCaseDetails', () => {
    it('does not store case details when no case reference is present in the request params', async () => {
      const context = createTestEffectContext({ params: {} });

      await effects.LoadCaseDetails(deps, context);

      expect(context.getData('caseDetails')).to.be.undefined;
    });

    it('does not store case details when client data has not been pre-fetched into state', async () => {
      const context = createTestEffectContext({ params: { caseReference: 'CASE123' } });

      await effects.LoadCaseDetails(deps, context);

      expect(context.getData('caseDetails')).to.be.undefined;
    });

    it('stores the pre-fetched client data under `caseDetails`', async () => {
      const clientData = { fullName: 'Jane Doe' };
      const context = createTestEffectContext({
        params: { caseReference: 'CASE123' },
        state: { client: clientData }
      });

      await effects.LoadCaseDetails(deps, context);

      expect(context.getData('caseDetails')).to.deep.equal({ status: 'success', data: clientData });
    });
  });

  describe('LoadCaseFinancialEligibility', () => {
    const financialEligibilityData = {
      hasPartner: true,
      isUnder17: true,
      isOver60: false,
      specificBenefits: {
        universalCredit: true,
        incomeSupport: false,
        jobSeekers: true,
        pensionCredit: false,
        employmentSupport: true
      },
      under18RegularPayment: false,
      under18HasValuables: false
    };

    it('does not call the API when no case reference is present in the request params', async () => {
      const context = createTestEffectContext({ params: {} });

      await effects.LoadCaseFinancialEligibility(deps, context);

      expect(getFinancialEligibilityStub.called).to.be.false;
      expect(context.getAllAnswers()).to.deep.equal({});
    });

    it('does not set any answers when getSession returns no session for the request', async () => {
      const context = createTestEffectContext({ params: { caseReference: 'CASE123' } });
      withNoSession(context);
      getFinancialEligibilityStub.resolves({ data: financialEligibilityData });

      await effects.LoadCaseFinancialEligibility(deps, context);

      expect(getFinancialEligibilityStub.calledOnce).to.be.true;
      expect(context.getAllAnswers()).to.deep.equal({});
    });

    it('sets Forge answers from the mapped API data when no draft answers exist', async () => {
      const context = createTestEffectContext({
        params: { caseReference: 'CASE123' },
        session: {}
      });
      getFinancialEligibilityStub.resolves({ data: financialEligibilityData });

      await effects.LoadCaseFinancialEligibility(deps, context);

      expect(context.getAnswer('under-18')).to.equal('yes');
      expect(context.getAnswer('under-18-receives-regular-payment')).to.equal('no');
      expect(context.getAnswer('under-18-has-valuables')).to.equal('no');
      expect(context.getAnswer('has-partner')).to.equal('yes');
      expect(context.getAnswer('60-or-over')).to.equal('no');
      expect(context.getAnswer('universal-credit')).to.equal('yes');
      expect(context.getAnswer('income-support')).to.equal('no');
      expect(context.getAnswer('income-based-jsa')).to.equal('yes');
      expect(context.getAnswer('pension-credit')).to.equal('no');
      expect(context.getAnswer('employment-support')).to.equal('yes');
      // Known gap: `60-or-over-with-partner` has no entry in mapApiValueToForgeValue, so it resolves to undefined instead of yes/no
      expect(context.getAnswer('60-or-over-with-partner')).to.equal(undefined);

      const session = context.getSession() as FinancialEligibilitySession;
      expect(session.financialEligibilityDrafts).to.deep.equal({ CASE123: {} });
    });

    it('uses the previously saved draft answer instead of the mapped API value when a draft exists', async () => {
      const context = createTestEffectContext({
        params: { caseReference: 'CASE123' },
        session: { financialEligibilityDrafts: { CASE123: { 'under-18': 'no' } } }
      });
      getFinancialEligibilityStub.resolves({ data: financialEligibilityData });

      await effects.LoadCaseFinancialEligibility(deps, context);

      expect(context.getAnswer('under-18')).to.equal('no');
    });
  });

  describe('PersistSavedAnswers', () => {
    it('does not call the API when getSession returns no session for the request', async () => {
      const context = createTestEffectContext({ params: { caseReference: 'CASE123' } });
      withNoSession(context);

      await effects.PersistSavedAnswers(deps, context);

      expect(updateFinancialEligibilityStub.called).to.be.false;
    });

    it('throws when the session has not been initialised with a financialEligibilityDrafts object', async () => {
      // Unlike LoadCaseFinancialEligibility, this method does not guard against a missing drafts object
      const context = createTestEffectContext({ params: { caseReference: 'CASE123' }, session: {} });
      let thrown: unknown;

      try {
        await effects.PersistSavedAnswers(deps, context);
      } catch (error) {
        thrown = error;
      }

      expect(thrown).to.be.instanceOf(TypeError);
      expect(updateFinancialEligibilityStub.called).to.be.false;
    });

    it('does not call the API when there is no case reference', async () => {
      const context = createTestEffectContext({
        params: {},
        session: { financialEligibilityDrafts: {} }
      });

      await effects.PersistSavedAnswers(deps, context);

      expect(updateFinancialEligibilityStub.called).to.be.false;
    });

    it('submits the saved draft answers for the current case to the API', async () => {
      const axiosMiddleware = { get: sinon.stub() };
      const context = createTestEffectContext({
        params: { caseReference: 'CASE123' },
        session: { financialEligibilityDrafts: { CASE123: { 'under-18': 'yes' } } },
        state: { authenticatedAxios: axiosMiddleware }
      });
      updateFinancialEligibilityStub.resolves({});

      await effects.PersistSavedAnswers(deps, context);

      expect(updateFinancialEligibilityStub.calledOnce).to.be.true;
      const [axiosArg, caseRefArg, payloadArg] = updateFinancialEligibilityStub.firstCall.args as [unknown, unknown, Record<string, unknown>];
      expect(axiosArg).to.equal(axiosMiddleware);
      expect(caseRefArg).to.equal('CASE123');
      expect(payloadArg.is_you_under_18).to.equal(true);
    });

    it('initialises an empty draft and submits the default payload when no answers have been saved yet', async () => {
      const context = createTestEffectContext({
        params: { caseReference: 'CASE123' },
        session: { financialEligibilityDrafts: {} }
      });
      updateFinancialEligibilityStub.resolves({});

      await effects.PersistSavedAnswers(deps, context);

      expect(updateFinancialEligibilityStub.calledOnce).to.be.true;
      const [, caseRefArg, payloadArg] = updateFinancialEligibilityStub.firstCall.args as [unknown, unknown, Record<string, unknown>];
      expect(caseRefArg).to.equal('CASE123');
      expect(payloadArg.under_18_passported).to.equal(false);
      const session = context.getSession() as FinancialEligibilitySession;
      expect(session.financialEligibilityDrafts.CASE123).to.deep.equal({});
    });
  });

  describe('ClearDraftAnswers', () => {
    it('does nothing when there is no case reference', async () => {
      const context = createTestEffectContext({
        params: {},
        session: { financialEligibilityDrafts: { CASE123: { 'under-18': 'yes' } } }
      });
      const getAllAnswersSpy = sinon.spy(context, 'getAllAnswers');

      await effects.ClearDraftAnswers(deps, context);

      const session = context.getSession() as FinancialEligibilitySession;
      expect(session.financialEligibilityDrafts.CASE123).to.deep.equal({ 'under-18': 'yes' });
      expect(getAllAnswersSpy.called).to.be.false;
    });

    it('does nothing when getSession returns no session for the request', async () => {
      const context = createTestEffectContext({ params: { caseReference: 'CASE123' } });
      withNoSession(context);
      const getAllAnswersSpy = sinon.spy(context, 'getAllAnswers');

      await effects.ClearDraftAnswers(deps, context);

      expect(getAllAnswersSpy.called).to.be.false;
    });

    it('throws when the session has not been initialised with a financialEligibilityDrafts object', async () => {
      // The `session?.` optional chain only guards a missing session, not a missing financialEligibilityDrafts object
      const context = createTestEffectContext({ params: { caseReference: 'CASE123' }, session: {} });
      let thrown: unknown;

      try {
        await effects.ClearDraftAnswers(deps, context);
      } catch (error) {
        thrown = error;
      }

      expect(thrown).to.be.instanceOf(TypeError);
    });

    it('does nothing when there is no draft for the current case', async () => {
      const context = createTestEffectContext({
        params: { caseReference: 'CASE123' },
        session: { financialEligibilityDrafts: {} }
      });
      const getAllAnswersSpy = sinon.spy(context, 'getAllAnswers');

      await effects.ClearDraftAnswers(deps, context);

      expect(getAllAnswersSpy.called).to.be.false;
    });

    it('deletes the draft answers for the current case', async () => {
      const context = createTestEffectContext({
        params: { caseReference: 'CASE123' },
        session: { financialEligibilityDrafts: { CASE123: { 'under-18': 'yes' } } }
      });
      const getAllAnswersSpy = sinon.spy(context, 'getAllAnswers');

      await effects.ClearDraftAnswers(deps, context);

      const session = context.getSession() as FinancialEligibilitySession;
      expect(session.financialEligibilityDrafts.CASE123).to.be.undefined;
      expect(getAllAnswersSpy.calledOnce).to.be.true;
    });
  });

  describe('SaveNewAnswerIfAnswered', () => {
    it('does nothing when there is no post data', async () => {
      const context = createTestEffectContext({ post: {} });

      await effects.SaveNewAnswerIfAnswered(deps, context);

      expect(context.getAllAnswers()).to.deep.equal({});
    });

    it('does not save an answer when there is no case reference', async () => {
      const context = createTestEffectContext({ post: { 'under-18': 'yes' }, params: {} });

      await effects.SaveNewAnswerIfAnswered(deps, context);

      expect(context.getAllAnswers()).to.deep.equal({});
    });

    it('does not save an answer when getSession returns no session for the request', async () => {
      const context = createTestEffectContext({
        post: { 'under-18': 'yes' },
        params: { caseReference: 'CASE123' }
      });
      withNoSession(context);

      await effects.SaveNewAnswerIfAnswered(deps, context);

      expect(context.getAllAnswers()).to.deep.equal({});
    });

    it('throws when the session has not been initialised with a financialEligibilityDrafts object', async () => {
      const context = createTestEffectContext({
        post: { 'under-18': 'yes' },
        params: { caseReference: 'CASE123' },
        session: {}
      });
      let thrown: unknown;

      try {
        await effects.SaveNewAnswerIfAnswered(deps, context);
      } catch (error) {
        thrown = error;
      }

      expect(thrown).to.be.instanceOf(TypeError);
      expect(context.getAllAnswers()).to.deep.equal({});
    });

    it('saves answered fields to the session draft and to Forge, skipping unanswered fields', async () => {
      const context = createTestEffectContext({
        post: {
          'under-18': 'yes',
          'has-partner': '',
          'universal-credit': null,
          'income-support': undefined
        },
        params: { caseReference: 'CASE123' },
        session: { financialEligibilityDrafts: {} }
      });

      await effects.SaveNewAnswerIfAnswered(deps, context);

      expect(context.getAnswer('under-18')).to.equal('yes');
      expect(context.hasAnswer('has-partner')).to.be.false;
      const session = context.getSession() as FinancialEligibilitySession;
      expect(session.financialEligibilityDrafts.CASE123).to.deep.equal({ 'under-18': 'yes' });
    });

    it('creates a new draft entry for the case when one does not already exist', async () => {
      const context = createTestEffectContext({
        post: { 'has-partner': 'no' },
        params: { caseReference: 'CASE456' },
        session: { financialEligibilityDrafts: {} }
      });

      await effects.SaveNewAnswerIfAnswered(deps, context);

      const session = context.getSession() as FinancialEligibilitySession;
      expect(session.financialEligibilityDrafts.CASE456).to.deep.equal({ 'has-partner': 'no' });
      expect(context.getAnswer('has-partner')).to.equal('no');
    });
  });
});
