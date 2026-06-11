import { defineEffectFunctions } from "@ministryofjustice/hmpps-forge/core/authoring";
import type { FinancialEligibilitySession } from "./context.type.js";
import { access, redirect, Condition, Session } from '@ministryofjustice/hmpps-forge/core/authoring'
import type { EffectFunctionContext, EffectFunctionExpr } from "@ministryofjustice/hmpps-forge/core/authoring";
import { mapAnswersToApiPayload } from '@ministryofjustice/financial-eligibility-journey';

export type Deps = {
  apiService: any;
}


export interface FinancialEligibilityEffectShape {
  /** Copies previously stored draft answers for this pattern into the form context on access. */
  LoadDraftAnswers: () => EffectFunctionExpr;
  /** Persists the current answers into the session as a draft, kept separately from committed answers. */
  SaveDraftAnswers: () => EffectFunctionExpr;
  /** Clears draft answers for this pattern (used after committing drafts to the store). */
  ClearDraftAnswers: () => EffectFunctionExpr;
  /** TODO Submit saved answers from session to cla_backend  */
  SubmitSavedAnswersToClaBackend: () => EffectFunctionExpr;
  /** Loads case details from the API and stores them in the context, for use in the journey. */
  LoadCaseDetails: () => EffectFunctionExpr;
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
  LoadDraftAnswers: (_deps) => (context: EffectFunctionContext) => {
    const stored = (context.getSession() as FinancialEligibilitySession | undefined)?.financialEligibilityDraft;

    if (!stored) {
      return;
    }

    for (const [code, value] of Object.entries(stored)) {
      if (!context.hasAnswer(code)) {
        context.setAnswer(code, value);
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

    if (typeof caseReference !== 'string') {
      console.error('No case reference found in path');
      return;
    }

    const axiosMiddleware = context.getState('authenticatedAxios')
    if (!axiosMiddleware) {
      console.warn('Authenticated Axios middleware not found in state; API call may fail if it is required by the service implementation.');
    }
    const details = await _deps.apiService.getClientDetails(caseReference, axiosMiddleware);
    
    console.log('Fetched case details for case reference', caseReference, details);
    context.setData('caseDetails', details);
  },

  /**
   * Saves draft financial eligibility answers
   * @param {unknown} _deps Effect dependencies supplied by Forge
   * @returns {(context: EffectFunctionContext) => void} Function to save stored draft answers to the session
   */
  SaveDraftAnswers: (_deps) => (context: EffectFunctionContext) => {
    console.log(`Saving FE answers in session...`, context.getAllAnswers());

    const session = context.getSession() as FinancialEligibilitySession | undefined;

    if (!session) {
      return;
    }

    if (!session.financialEligibilityDraft) {
      session.financialEligibilityDraft = {};
    }

    session.financialEligibilityDraft = {
      ...session.financialEligibilityDraft,
      ...context.getAllAnswers(),
    };

    console.log(`Saved FE answers in session:`, session.financialEligibilityDraft);
  },


  /**
   * Submit saved answers from session to cla_backend
   * @param {unknown} _deps Effect dependencies supplied by Forge
   * @returns {(context: EffectFunctionContext) => Promise<void>} Async function to submit saved answers to cla_backend
   */
  SubmitSavedAnswersToClaBackend: (_deps) => async (context: EffectFunctionContext) => {
    console.log(`Saving FE answers in session...`, context.getAllAnswers());

    const session = context.getSession() as FinancialEligibilitySession | undefined;

    if (!session) {
      return;
    }

    if (!session.financialEligibilityDraft) {
      session.financialEligibilityDraft = {};
    }

    session.financialEligibilityDraft = {
      ...session.financialEligibilityDraft,
      ...context.getAllAnswers(),
    };

    // Make API call to CLA backend with the apiService.
    const axiosMiddleware = context.getState('authenticatedAxios')
    if (!axiosMiddleware) {
      console.warn("Authenticated Axios middleware not found in state; API call may fail if it is required by the service implementation.");
    }
    await _deps.apiService.updateFinancialEligibility(
      axiosMiddleware,
      context.getRequestParam('caseReference'),
      mapAnswersToApiPayload(session.financialEligibilityDraft)
    );

    console.log(`Submitted FE answers in session, to cla_backend:`, session.financialEligibilityDraft);
  },

  /**
   * Clears draft financial eligibility answers, in the session
   * @param {unknown} _deps Effect dependencies supplied by Forge
   * @returns {(context: EffectFunctionContext) => void} Function to clear stored draft answers to the context
   */
  ClearDraftAnswers: (_deps) => {
    return (context: EffectFunctionContext) => {
      const session = context.getSession() as FinancialEligibilitySession | undefined;

      if (session?.financialEligibilityDraft) {
        delete session.financialEligibilityDraft;
      }

      for (const key of Object.keys(context.getAllAnswers())) {
        context.clearAnswer(key);
      }

      console.log(`Cleared FE answers in session:`, context.getAllAnswers());
    };
  },

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