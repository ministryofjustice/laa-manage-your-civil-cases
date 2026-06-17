import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core/authoring";
import { type FinancialEligibilityEffectsWithDeps, type Deps } from '#packages/financial-eligibility-journey/src/api.js';
import { type FinancialEligibilitySession } from '#packages/financial-eligibility-journey/src/context.type.js';
import { over60Step, partnerStep, under17GroupStep } from "#packages/financial-eligibility-journey/src/index.js";
import { type apiService } from "./api/index.js";

/**
 * Utility function to map step codes to API field names for financial eligibility data
 * @param {string} stepCode - The code of the step to map
 * @returns {string | null} The corresponding API field name, or null if no mapping exists
 */
export function mapStepCodeToApiField(stepCode: string): string | null {
    const mapping: Record<string, string> = {
        [over60Step.code]: 'is_you_or_your_partner_over_60',
        [under17GroupStep.code]: 'is_you_under_18',
        [partnerStep.code]: 'has_partner',
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
        'is_you_or_your_partner_over_60': over60Step.code,
        'is_you_under_18': under17GroupStep.code,
        'has_partner': partnerStep.code,
    };

    return mapping[apiField] || null;
}

/**
 * Utility function to map user answers from the Forge journey to the API payload format
 * @param {Record<string, any>} answers - The user's answers keyed by step code
 * @returns {Record<string, unknown>} The API payload with mapped field names and values
 */
export function mapAnswersToApiPayload(answers: Record<string, any>): Record<string, unknown> {
    const payload: Record<string, unknown> = {};
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

/**
 * This class implements the FinancialEligibilityWithDeps interface, providing methods to handle financial eligibility operations with dependencies.
 * It uses the provided dependencies to perform actions such as loading draft answers, clearing drafts, persisting saved answers, and loading case details.
 */
export class FinancialEligibilityEffectsWithDepsImpl implements FinancialEligibilityEffectsWithDeps {

    private readonly apiService: Record<string, CallableFunction>;

    /**
     * Constructs an instance of FinancialEligibilityEffectsWithDepsImpl with the provided API service.
     * @param {Record<string, CallableFunction>} apiService - The API service to be used for financial eligibility operations
     */
    constructor(apiService: Record<string, CallableFunction>) {
        this.apiService = apiService;
    }

    /**
     * Loads draft financial eligibility answers from session storage
     * @param {Deps} _deps Effect dependencies supplied by Forge
     * @param {EffectFunctionContext} context The context of the effect function, providing access to request parameters and session data
     */
    LoadDraftAnswers = async (_deps: Deps, context: EffectFunctionContext): Promise<void> => {
        const caseReference = context.getRequestParam('caseReference');
        const session = context.getSession() as FinancialEligibilitySession | undefined;
        if (session && session.financialEligibilityDrafts === undefined) {
            session.financialEligibilityDrafts = {};
        }

        const stored = session?.financialEligibilityDrafts[caseReference || ''] ?? null;

        if (!stored) {
        return;
        }

        const axiosMiddleware = context.getState('authenticatedAxios')
        if (!axiosMiddleware) {
            console.warn('Authenticated Axios middleware not found in state; API call may fail if it is required by the service implementation.');
        }
        const financialEligibilityData = await this.apiService.getFinancialEligibility(axiosMiddleware, caseReference);
        for (const [code, value] of Object.entries(financialEligibilityData)) {
            if (!context.hasAnswer(code)) {
                const stepCode = mapApiFieldToStepCode(code);
                if (stepCode) {
                    context.setAnswer(stepCode, value);
                }
            }
        }
    };

    /**
     * Loads case details from the API and stores them in the context, for use in the journey.
     * @param {Deps} _deps Effect dependencies supplied by Forge, expected to include a fetchClientDetails function
     * @param {EffectFunctionContext} context The context of the effect function, providing access to request parameters and session data
     */
    LoadCaseDetails = async (_deps: Deps, context: EffectFunctionContext): Promise<void> => {
        const caseReference = context.getRequestParam('caseReference');

        if (caseReference === undefined) {
            console.error('No case reference found in path');
            return;
        }

        const axiosMiddleware = context.getState('authenticatedAxios')
        if (!axiosMiddleware) {
            console.warn('Authenticated Axios middleware not found in state; API call may fail if it is required by the service implementation.');
        }
        const details = await this.apiService.getClientDetails(axiosMiddleware, caseReference);
        
        console.log('Fetched case details for case reference', caseReference, details);
        context.setData('caseDetails', details);
    }

    /**
     * Loads financial eligibility data from the API and stores it in the context, for use in the journey.
     * @param {Deps} _deps Effect dependencies supplied by Forge, expected to include a getFinancialEligibility function
     * @param {EffectFunctionContext} context The context of the effect function, providing access to request parameters and session data
     */
    LoadCaseFinancialEligibility = async (_deps: Deps, context: EffectFunctionContext): Promise<void> => {
        const caseReference = context.getRequestParam('caseReference');

        if (caseReference === undefined) {
            console.error('No case reference found in path');
            return;
        }

        const axiosMiddleware = context.getState('authenticatedAxios')
        if (!axiosMiddleware) {
            console.warn('Authenticated Axios middleware not found in state; API call may fail if it is required by the service implementation.');
        }
        const financialEligibilityData = await this.apiService.getFinancialEligibility(axiosMiddleware, caseReference);
        
        console.log('Fetched financial eligibility data for case reference', caseReference, financialEligibilityData);
        
        // TODO: Map API response to form answers with a utility function, rather than hardcoding field mappings here
        context.setAnswer('under17', financialEligibilityData.is_you_under_18 ? 'yes' : 'no');
        context.setAnswer('over-60', financialEligibilityData.is_you_or_your_partner_over_60 ? 'yes' : 'no');
        context.setAnswer('partner', financialEligibilityData.has_partner ? 'yes' : 'no');
    }

    /**
     * Persists saved answers from session to the backend API.
     * @param {Deps} _deps Effect dependencies supplied by Forge, expected to include an apiService with an updateFinancialEligibility function
     * @param {EffectFunctionContext} context The context of the effect function, providing access to request parameters and session data
     */
    PersistSavedAnswers = async (_deps: Deps, context: EffectFunctionContext): Promise<void> => {
        console.log(`Saving FE answers in session...`, context.getAllAnswers());
        
        const session = context.getSession() as FinancialEligibilitySession | undefined;
    
        if (!session) {
            return;
        }
    
        const caseReference = context.getRequestParam('caseReference')
        if (caseReference === undefined) {
            console.error('No case reference found in path; cannot submit draft answers');
            return;
        }
    
        if (!session.financialEligibilityDrafts[caseReference]) {
            session.financialEligibilityDrafts[caseReference] = {};
        }
    
        // Make API call to CLA backend with the apiService.
        const axiosMiddleware = context.getState('authenticatedAxios')
        if (!axiosMiddleware) {
            console.warn("Authenticated Axios middleware not found in state; API call may fail if it is required by the service implementation.");
        }
        await this.apiService.updateFinancialEligibility(
            axiosMiddleware,
            context.getRequestParam('caseReference'),
            mapAnswersToApiPayload(session.financialEligibilityDrafts[caseReference])
        );
    
        console.log(`Submitted FE answers in session, to cla_backend:`, session.financialEligibilityDrafts[caseReference]);
    }

    /**
     * Clears draft financial eligibility answers from the session.
     * @param {Deps} _deps Effect dependencies supplied by Forge
     * @param {EffectFunctionContext} context The context of the effect function, providing access to request parameters and session data
     */
    ClearDraftAnswers = async (_deps: Deps, context: EffectFunctionContext): Promise<void> => {
        const session = context.getSession() as FinancialEligibilitySession | undefined;

        const caseReference = context.getRequestParam('caseReference')
        if (caseReference === undefined) {
            console.error('No case reference found in path; cannot clear draft answers');
            return;
        }

        if (session?.financialEligibilityDrafts[caseReference]) {
            delete session.financialEligibilityDrafts[caseReference];
        }
    }

    /**
     * Saves a new answer if it has been answered, by checking the post data for any answers and saving them to the session as drafts.
     * @param {Deps} _deps Effect dependencies supplied by Forge
     * @param {EffectFunctionContext} context The context of the effect function, providing access to request parameters and session data
     */
    SaveNewAnswerIfAnswered = async (_deps: Deps, context: EffectFunctionContext): Promise<void> => {
        const requestPostData = context.getPostData();
        const answerKeys = Object.keys(requestPostData);

        if (answerKeys.length === 0) {
            return;
        }

        const caseReference = context.getRequestParam('caseReference')
        if (caseReference === undefined) {
            console.error('No case reference found in path; cannot save new answer');
            return;
        }
        const session = context.getSession() as FinancialEligibilitySession | undefined;

        if (!session) {
            return;
        }

        if (!session.financialEligibilityDrafts[caseReference]) {
            session.financialEligibilityDrafts[caseReference] = {};
        }

        for (const key of answerKeys) {
            const value = requestPostData[key];
            if (value !== undefined && value !== null && value !== '') {
                session.financialEligibilityDrafts[caseReference][key] = value;

                // Also set the answer in the context so that Forge can handle redirections correctly
                context.setAnswer(key, value);
            }
        }

        console.log(`Saved new FE answers in session...`, session.financialEligibilityDrafts);
        console.log('Current state of all FE answers in session:', session.financialEligibilityDrafts);
    }

}