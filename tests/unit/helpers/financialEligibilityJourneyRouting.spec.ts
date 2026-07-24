import { expect } from 'chai';
import { under17Step } from '#packages/financial-eligibility-journey/src/under17Page/under17Step.js';
import { under18RegularPaymentStep } from '#packages/financial-eligibility-journey/src/under18RegularPaymentPage/under18RegularPaymentStep.js';
import { partnerStep } from '#packages/financial-eligibility-journey/src/partnerPage/partnerStep.js';
import { under18HasValuablesStep } from '#packages/financial-eligibility-journey/src/under18HasValuablesPage/under18HasValuablesStep.js';
import { over60Step } from '#packages/financial-eligibility-journey/src/over60Page/over60Step.js';
import { over60StepWithPartnerStep } from '#packages/financial-eligibility-journey/src/over60PWithPartnerPage/over60WithPartnerStep.js';

describe('Financial eligibility Forge routing', () => {
  it('routes under-17 answers to the correct next steps', () => {
    const submitConfig = under17Step.onSubmission?.[1];
    const next = submitConfig?.onValid?.next;
    const redirectGoesTo = (next ?? [])
      .map((outcome) => ('goto' in outcome ? outcome.goto : null))
      .filter((goto): goto is string => goto !== null);

    expect(redirectGoesTo).to.have.length(3);
    expect(redirectGoesTo[0]).to.equal(under18RegularPaymentStep.code);
    expect(redirectGoesTo[1]).to.equal(partnerStep.code);
    expect(redirectGoesTo[2]).to.equal(partnerStep.code);
  });

  it('routes under-18-receives-regular-payment answers to the correct next steps', () => {
    const submitConfig = under18RegularPaymentStep.onSubmission?.[1];
    const next = submitConfig?.onValid?.next;
    const redirectGoesTo = (next ?? [])
      .map((outcome) => ('goto' in outcome ? outcome.goto : null))
      .filter((goto): goto is string => goto !== null);

    expect(redirectGoesTo).to.have.length(1);
    expect(redirectGoesTo[0]).to.equal(under18HasValuablesStep.code);
  });

  it('routes partner answers to the correct next steps', () => {
    const submitConfig = partnerStep.onSubmission?.[1];
    const next = submitConfig?.onValid?.next;
    const redirectGoesTo = (next ?? [])
      .map((outcome) => ('goto' in outcome ? outcome.goto : null))
      .filter((goto): goto is string => goto !== null);

    expect(redirectGoesTo).to.have.length(3);
    expect(redirectGoesTo[0]).to.equal(over60StepWithPartnerStep.code);
    expect(redirectGoesTo[1]).to.equal(over60Step.code);
    expect(redirectGoesTo[2]).to.equal(over60Step.code);
  });
});
