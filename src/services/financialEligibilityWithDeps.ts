import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core/authoring";
import { type FinancialEligibilityEffectsWithDeps, type Deps } from '#packages/financial-eligibility-journey/src/api.js';
import { type FinancialEligibilitySession } from '#packages/financial-eligibility-journey/src/context.type.js';
import { over60Step, partnerStep, under17GroupStep } from "#packages/financial-eligibility-journey/src/index.js";
import { type FinancialEligibilityData } from "#types/api-types.js";

/**
 * Utility function to map step codes to API field names for financial eligibility data
 * @param {string} stepCode - The code of the step to map
 * @returns {string | null} The corresponding API field name, or null if no mapping exists
 */
function mapStepCodeToApiField(stepCode: string): string | null {
    const mapping: Record<string, string> = {
        [over60Step.code]: 'is_you_or_your_partner_over_60',
        [under17GroupStep.code]: 'is_you_under_18',
        [partnerStep.code]: 'has_partner',
    };

    return mapping[stepCode] || null;
}

/**
 * Utility function to map financial eligibility API data to step codes for use in the Forge journey
 * @param {FinancialEligibilityData} financialEligibilityData - The financial eligibility data from the API
 * @returns {Record<string, unknown>} A record mapping step codes to their corresponding values
 */
function mapFinancialEligibilityApiDataToStepCodes(financialEligibilityData: FinancialEligibilityData): Record<string, unknown> {
    return {
        [over60Step.code]: financialEligibilityData.isOver60,
        [under17GroupStep.code]: financialEligibilityData.isUnder17,
        [partnerStep.code]: financialEligibilityData.hasPartner,
    }
}

/**
 * Utility function to map API values to Forge answer values based on step codes
 * @param {unknown} apiValue - The value from the API to map
 * @param {string} stepCode - The code of the step to determine the mapping
 * @returns {unknown} The corresponding Forge answer value
 */
function mapApiValueToForgeValue(apiValue: unknown, stepCode: string): unknown {
    return {
        [over60Step.code]: apiValue ? 'yes' : 'no',
        [under17GroupStep.code]: apiValue ? 'yes' : 'no',
        [partnerStep.code]: apiValue ? 'yes' : 'no',
    }[stepCode];
}

/**
 * Utility function to map user answers from the Forge journey to the API payload format
 * @param {Record<string, any>} answers - The user's answers keyed by step code
 * @returns {Record<string, unknown>} The API payload with mapped field names and values
 */
function mapAnswersToApiPayload(answers: Record<string, any>): Record<string, unknown> {
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
     * Loads financial eligibility data from the API, checks if any questions have been answered so that they
     * take precedence over the API data, and stores the results in Forge's answers.
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
        const financialEligibilityResponse = await this.apiService.getFinancialEligibility(axiosMiddleware, caseReference);
        
        const session = context.getSession() as FinancialEligibilitySession | undefined;
        if (!session) {
            console.error('No session found; cannot load financial eligibility data');
            return;
        }
        

        const mappedAnswers = mapFinancialEligibilityApiDataToStepCodes(financialEligibilityResponse.data);
        for (const [stepCode, apiValue] of Object.entries(mappedAnswers)) {
            const caseFEDraft = session.financialEligibilityDrafts[caseReference] || {};
            if (stepCode in caseFEDraft) {
                context.setAnswer(stepCode, caseFEDraft[stepCode]);
            } else {
                const answerValue = mapApiValueToForgeValue(apiValue, stepCode);
                context.setAnswer(stepCode, answerValue);
            }
        }
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
            context.getAllAnswers();
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