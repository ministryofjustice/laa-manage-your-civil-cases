import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core/authoring";
import type { AxiosInstanceWrapper } from "#types/axios-instance-wrapper.js";
import type { ClientDetailsApiResponse, FinancialEligibilityData } from "#types/api-types.js";

export interface Deps {
    effectsWithDeps: FinancialEligibilityEffectsWithDeps;
}

export interface FinancialEligibilityEffectsWithDeps {
    LoadCaseDetails: (_deps: Deps, context: EffectFunctionContext) => Promise<void>;
    LoadCaseFinancialEligibility: (_deps: Deps, context: EffectFunctionContext) => Promise<void>;
    PersistSavedAnswers: (_deps: Deps, context: EffectFunctionContext) => Promise<void>;
    ClearDraftAnswers: (_deps: Deps, context: EffectFunctionContext) => Promise<void>;
    SaveNewAnswerIfAnswered: (_deps: Deps, context: EffectFunctionContext) => Promise<void>;
}

export interface FinancialEligibilityApiService {
    getClientDetails: (axiosMiddleware: AxiosInstanceWrapper, caseReference: string) => Promise<ClientDetailsApiResponse>;
    updateFinancialEligibility: (
        axiosMiddleware: AxiosInstanceWrapper,
        caseReference: string,
        updateData: Partial<FinancialEligibilityData>
    ) => Promise<ClientDetailsApiResponse>;
}