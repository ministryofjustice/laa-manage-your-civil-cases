import type { Request } from 'express';
import { apiService } from '#src/services/apiService.js';
import { devLog, setSessionValue } from '#src/scripts/helpers/index.js';
import type { FinancialEligibilityData } from '#types/api-types.js';
import { mapAnswersToApiPayload, mapFinancialEligibilityApiDataToAnswerCodes } from '#src/services/financialEligibilityWithDeps.js';

/**
 * Functon to call financial eligibility, reset disputed fields and update in cla_backend
 * @param {Request} req request
 * @param {string} caseReference case reference
 */
export async function resetDisputedFieldData(req: Request, caseReference: string): Promise<void> {
  const financialEligibilityResponse = await apiService.getFinancialEligibility(
    req.axiosMiddleware,
    caseReference
  );

  if(financialEligibilityResponse.status === 'error' || !financialEligibilityResponse.data) {
    throw new Error(
      financialEligibilityResponse.message ||
      'Failed to retrieve financial eligibility'
    );
  }

  const answers = mapFinancialEligibilityApiDataToAnswerCodes(financialEligibilityResponse.data);

  const updatePayload = mapAnswersToApiPayload(answers);

  updatePayload.disputed_savings = {
    bank_balance: null,
    investment_balance: null,
    asset_balance: null,
    credit_balance: null,
  };

  if(Array.isArray(updatePayload.property_set)) {
    updatePayload.property_set =
      updatePayload.property_set.map(property => ({
        ...(property as Record<string, unknown>),
        disputed: false
      }));
  }

  devLog(`Reset FE payload for case ${caseReference}: ` + JSON.stringify(updatePayload, null, 2));

  const updateResponse = await apiService.updateFinancialEligibility(
    req.axiosMiddleware,
    caseReference,
    updatePayload as unknown as Partial<FinancialEligibilityData>
  );

  if(updateResponse.status === 'error') {
    throw new Error(updateResponse.message || 'Failed to reset disputed financial eligibility fields');
  }

  devLog(`Disputed financial eligibility fields reset for case ${caseReference}`);
}