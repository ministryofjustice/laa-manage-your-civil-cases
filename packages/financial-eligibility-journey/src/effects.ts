import { defineEffectFunctions } from "@ministryofjustice/hmpps-forge/core/authoring";
import type { FinancialEligibilitySession } from "./context.type.js";
import { access, redirect, Condition, Session } from '@ministryofjustice/hmpps-forge/core/authoring'
import type { EffectFunctionContext, EffectFunctionExpr } from "@ministryofjustice/hmpps-forge/core/authoring";

export interface FinancialEligibilityEffectShape {
  /** Copies previously stored draft answers for this pattern into the form context on access. */
  LoadDraftAnswers: () => EffectFunctionExpr;
  /** Persists the current answers into the session as a draft, kept separately from committed answers. */
  SaveDraftAnswers: () => EffectFunctionExpr;
  /** Clears draft answers for this pattern (used after committing drafts to the store). */
  ClearDraftAnswers: () => EffectFunctionExpr;
  /** TODO Submit saved answers from session to cla_backend  */
  SubmitSavedAnswersToClaBackend: () => EffectFunctionExpr;
}

export const {
  effects: FinancialEligibilityEffects,
  implementations: FinancialEligibilityEffectsImplementations,
} = defineEffectFunctions<FinancialEligibilityEffectShape>({
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
   * SSubmit saved answers from session to cla_backend
   * @param {unknown} _deps Effect dependencies supplied by Forge
   * @returns {(context: EffectFunctionContext) => void} Function to submit saved answers to cla_backend
   */
  SubmitSavedAnswersToClaBackend: (_deps) => (context: EffectFunctionContext) => {
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