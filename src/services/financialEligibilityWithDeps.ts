import type { EffectFunctionContext, EffectFunctionExpr } from "@ministryofjustice/hmpps-forge/core/authoring";
import { type FinancialEligibilityEffectsWithDeps, type Deps, mapApiFieldToStepCode, mapAnswersToApiPayload } from '#packages/financial-eligibility-journey/src/api.js';
import { type FinancialEligibilitySession } from '#packages/financial-eligibility-journey/src/context.type.js';

/**
 * This class implements the FinancialEligibilityWithDeps interface, providing methods to handle financial eligibility operations with dependencies.
 * It uses the provided dependencies to perform actions such as loading draft answers, clearing drafts, persisting saved answers, and loading case details.
 */
export class FinancialEligibilityEffectsWithDepsImpl implements FinancialEligibilityEffectsWithDeps {

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
        const financialEligibilityData = await _deps.apiService.getFinancialEligibility(axiosMiddleware, caseReference);
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
        const details = await _deps.apiService.getClientDetails(axiosMiddleware, caseReference);
        
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
        const financialEligibilityData = await _deps.apiService.getFinancialEligibility(axiosMiddleware, caseReference);
        
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
        await _deps.apiService.updateFinancialEligibility(
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
    SaveNewAnswerIfAnswered = (_deps: Deps, context: EffectFunctionContext): void => {
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