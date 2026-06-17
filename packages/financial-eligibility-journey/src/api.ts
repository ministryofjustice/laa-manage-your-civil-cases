
import type { EffectFunctionContext, EffectFunctionExpr } from "@ministryofjustice/hmpps-forge/core/authoring";

export interface Deps {
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


export interface FinancialEligibilityApiService {
    getClientDetails: (caseReference: string, axiosMiddleware?: any) => Promise<any>;
    updateFinancialEligibility: (caseReference: string, updateData: Record<string, any>, axiosMiddleware?: any) => Promise<any>;
}