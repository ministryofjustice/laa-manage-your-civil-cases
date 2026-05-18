import {  defineEffectFunctions} from "@ministryofjustice/hmpps-forge/core/authoring";
import type { EffectFunctionExpr } from "@ministryofjustice/hmpps-forge/core/authoring";
import { access, redirect, Condition, Session } from '@ministryofjustice/hmpps-forge/core/authoring'
import type { FinancialEligibilityEffectContext } from "./context.type.ts";

export interface FinancialEligibilityEffectShape {
  /** Copies previously stored draft answers for this pattern into the form context on access. */
  LoadDraftAnswers: () => EffectFunctionExpr;
  /** Persists the current answers into the session as a draft, kept separately from committed answers. */
  SaveDraftAnswers: () => EffectFunctionExpr;
  /** Clears draft answers for this pattern (used after committing drafts to the store). */
  ClearDraftAnswers: () => EffectFunctionExpr;
}

export const {
  effects: FinancialEligibilityEffects,
  implementations: FinancialEligibilityEffectsImplementations,
} = defineEffectFunctions<FinancialEligibilityEffectShape>({
  /**
   * Loads draft financial eligibility answers from session storage
   * @returns {(context: FinancialEligibilityEffectContext) => void} Function to apply stored draft answers to the context
   */
  LoadDraftAnswers:
    () => (context: FinancialEligibilityEffectContext) => {
      const stored = context.getSession()?.financialEligibilityDraft;

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
   * @returns {(context: FinancialEligibilityEffectContext) => void} Function to save stored draft answers to the session
   */
  SaveDraftAnswers:
    () => (context: FinancialEligibilityEffectContext) => {
        console.log(`Saving answers in session...`, context.getAllAnswers());

      const session = context.getSession();

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

      console.log(`Saved answers in session:`, session.financialEligibilityDraft);
    },

  /**
   * Clears draft financial eligibility answers, in the session
   * @returns {(context: FinancialEligibilityEffectContext) => void} Function to clear stored draft answers to the context
   */
  ClearDraftAnswers: () => {
    return (context: FinancialEligibilityEffectContext) => {
      const session = context.getSession();

      if (session?.financialEligibilityDraft) {
        delete session.financialEligibilityDraft;
      }

      for (const key of Object.keys(context.getAllAnswers())) {
        context.clearAnswer(key);
      }
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