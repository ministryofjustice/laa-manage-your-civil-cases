import { expect } from 'chai';
import { under17Step } from '#packages/financial-eligibility-journey/src/under17Page/under17Step.js';
import { under18RegularPaymentStep } from '#packages/financial-eligibility-journey/src/under18RegularPaymentPage/under18RegularPaymentStep.js';
import { partnerStep } from '#packages/financial-eligibility-journey/src/partnerPage/partnerStep.js';

describe('Financial eligibility Forge routing', () => {
  it('routes under-17 answers to the correct next steps', () => {
    const submitConfig = under17Step.onSubmission?.[0];
    const next = submitConfig?.onValid?.next;
    const redirectGotos = (next ?? [])
      .map((outcome) => ('goto' in outcome ? outcome.goto : null))
      .filter((goto): goto is string => goto !== null);

    expect(redirectGotos).to.have.length(3);
    expect(redirectGotos[0]).to.equal(under18RegularPaymentStep.code);
    expect(redirectGotos[1]).to.equal(partnerStep.code);
    expect(redirectGotos[2]).to.equal(partnerStep.code);
  });
});
