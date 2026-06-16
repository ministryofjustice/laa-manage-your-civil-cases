
import type { EffectFunctionContext, EffectFunctionExpr } from "@ministryofjustice/hmpps-forge/core/authoring";
export interface Deps {
    apiService: any;
    effectsWithDeps: FinancialEligibilityEffectsWithDeps;
}

export interface FinancialEligibilityEffectsWithDeps {
    LoadDraftAnswers: (_deps: Deps, context: EffectFunctionContext) => Promise<void>;
    LoadCaseDetails: (_deps: Deps, context: EffectFunctionContext) => Promise<void>;
    LoadCaseFinancialEligibility: (_deps: Deps, context: EffectFunctionContext) => Promise<void>;
    PersistSavedAnswers: (_deps: Deps, context: EffectFunctionContext) => Promise<void>;
    ClearDraftAnswers: (_deps: Deps, context: EffectFunctionContext) => Promise<void>;
    SaveNewAnswerIfAnswered: (_deps: Deps, context: EffectFunctionContext) => Promise<void>;
}

export const STEP_CODES = {
    OVER_60: 'over-60',
    UNDER_17: 'under17',
    HAS_PARTNER: 'partner',
};

/**
 * Utility function to map step codes to API field names for financial eligibility data
 * @param {string} stepCode - The code of the step to map
 * @returns {string | null} The corresponding API field name, or null if no mapping exists
 */
export function mapStepCodeToApiField(stepCode: string): string | null {
    const mapping: Record<string, string> = {
        [STEP_CODES.OVER_60]: 'is_you_or_your_partner_over_60',
        [STEP_CODES.UNDER_17]: 'is_you_under_18',
        [STEP_CODES.HAS_PARTNER]: 'has_partner',
    };

    return mapping[stepCode] || null;
}


/**
 * Utility function to map API field names to step codes for financial eligibility data
 * @param {string} apiField - The API field name to map
 * @returns {string | null} The corresponding step code, or null if no mapping exists
 */
export function mapApiFieldToStepCode(apiField: string): string | null {
    const mapping: Record<string, string> = {
        'is_you_or_your_partner_over_60': STEP_CODES.OVER_60,
        'is_you_under_18': STEP_CODES.UNDER_17,
        'has_partner': STEP_CODES.HAS_PARTNER,
    };

    return mapping[apiField] || null;
}


/**
 * Utility function to map user answers from the Forge journey to the API payload format
 * @param {Record<string, any>} answers - The user's answers keyed by step code
 * @returns {Record<string, any>} The API payload with mapped field names and values
 */
export function mapAnswersToApiPayload(answers: Record<string, any>): Record<string, any> {
    const payload: Record<string, any> = {};
    for (const [stepCode, answer] of Object.entries(answers)) {
        const apiField = mapStepCodeToApiField(stepCode);
        if (apiField) {
            if (typeof answer === 'string') {
                if (answer.toLowerCase() === 'yes') {
                    payload[apiField] = true;
                } else if (answer.toLowerCase() === 'no') {
                    payload[apiField] = false;
                } else {
                    payload[apiField] = answer;
                }
            } else {
                payload[apiField] = answer;
            }
        }
    }
    return payload;
}


export interface FinancialEligibilityApiService {
    getClientDetails: (caseReference: string, axiosMiddleware?: any) => Promise<any>;
    updateFinancialEligibility: (caseReference: string, updateData: Record<string, any>, axiosMiddleware?: any) => Promise<any>;
}