import { defineEffectFunctions } from "@ministryofjustice/hmpps-forge/core/authoring";
import type { FinancialEligibilitySession } from "./context.type.js";
import { access, redirect, Condition, Session } from '@ministryofjustice/hmpps-forge/core/authoring'
import type { EffectFunctionContext, EffectFunctionExpr } from "@ministryofjustice/hmpps-forge/core/authoring";
import { mapAnswersToApiPayload, mapApiFieldToStepCode } from '@ministryofjustice/financial-eligibility-journey';

export interface Deps {
  apiService: any;
}


export interface FinancialEligibilityEffectShape {
  /** Copies previously stored draft answers for this pattern into the form context on access. */
  LoadDraftAnswers: () => EffectFunctionExpr;
  /** Clears draft answers for this pattern (used after committing drafts to the store). */
  ClearDraftAnswers: () => EffectFunctionExpr;
  /** Submit saved answers from session to cla_backend  */
  PersistSavedAnswers: () => EffectFunctionExpr;
  /** Loads case details from the API and stores them in the context, for use in the journey. */
  LoadCaseDetails: () => EffectFunctionExpr;
  /** Loads financial eligibility data from the API and stores it in the context, for use in the journey. */
  LoadCaseFinancialEligibility: () => EffectFunctionExpr;
  /** Saves a new answer if it has been answered */
  SaveNewAnswerIfAnswered: () => EffectFunctionExpr;
}

export const {
  effects: FinancialEligibilityEffects,
  implementations: FinancialEligibilityEffectsImplementations,
} = defineEffectFunctions<FinancialEligibilityEffectShape, Deps>({
  /**
   * Loads draft financial eligibility answers from session storage
   * @param {unknown} _deps Effect dependencies supplied by Forge
   * @returns {(context: EffectFunctionContext) => void} Function to apply stored draft answers to the context
   */
  LoadDraftAnswers: (_deps) => async (context: EffectFunctionContext) => {
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
  },

  /**
   * Loads case details from the API and stores them in the context, for use in the journey.
   * @param {unknown} _deps Effect dependencies supplied by Forge, expected to include a fetchClientDetails function
   * @returns {(context: EffectFunctionContext) => Promise<void>} Async function to load case details and store in context
   */
  LoadCaseDetails: (_deps) => async (context: EffectFunctionContext) => {
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
  },

  /**
   * Loads financial eligibility data from the API and stores it in the context, for use in the journey.
   * @param {unknown} _deps Effect dependencies supplied by Forge, expected to include a getFinancialEligibility function
   * @returns {(context: EffectFunctionContext) => Promise<void>} Async function to load financial eligibility data and store in context
   */
  LoadCaseFinancialEligibility: (_deps) => async (context: EffectFunctionContext) => {
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
  },

  /**
   * Submit saved answers from session to cla_backend
   * @param {unknown} _deps Effect dependencies supplied by Forge
   * @returns {(context: EffectFunctionContext) => Promise<void>} Async function to submit saved answers to cla_backend
   */
  PersistSavedAnswers: (_deps) => async (context: EffectFunctionContext) => {
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
  },

  /**
   * Clears draft financial eligibility answers, in the session
   * @param {unknown} _deps Effect dependencies supplied by Forge
   * @returns {(context: EffectFunctionContext) => void} Function to clear stored draft answers to the context
   */
  ClearDraftAnswers: (_deps) => {
    return (context: EffectFunctionContext) => {
      const session = context.getSession() as FinancialEligibilitySession | undefined;

      const caseReference = context.getRequestParam('caseReference')
      if (caseReference === undefined) {
        console.error('No case reference found in path; cannot clear draft answers');
        return;
      }

      if (session?.financialEligibilityDrafts[caseReference]) {
        delete session.financialEligibilityDrafts[caseReference];
      }
    };
  },

  /**
   * Saves a new answer if it has been answered, by checking the post data for any answers and saving them to the session as drafts
   * @param {unknown} _deps Effect dependencies supplied by Forge
   * @returns {(context: EffectFunctionContext) => void} Function to save new answers to the session as drafts
   */
  SaveNewAnswerIfAnswered: (_deps) => (context: EffectFunctionContext) => {
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

});

/**
 * Make sure that these pages can't be viewed unless logged in
 * @returns {EffectFunctionExpr} Access control definition that enforces authentication
 */
export const requireAuth = () =>
  access({
    next: [
      redirect({
        when: Session('authCredentials').not.match(Condition.IsRequired()),
        goto: '/',
      }),
    ],
  })