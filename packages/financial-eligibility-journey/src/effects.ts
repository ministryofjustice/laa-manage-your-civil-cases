import { defineEffectFunctions } from "@ministryofjustice/hmpps-forge/core/authoring";
import { access, redirect, Condition, Session } from '@ministryofjustice/hmpps-forge/core/authoring'
import type { EffectFunctionContext, EffectFunctionExpr } from "@ministryofjustice/hmpps-forge/core/authoring";
import { type Deps } from '@ministryofjustice/financial-eligibility-journey';

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
    await _deps.effectsWithDeps.LoadDraftAnswers(_deps, context);
  },

  /**
   * Loads case details from the API and stores them in the context, for use in the journey.
   * @param {unknown} _deps Effect dependencies supplied by Forge, expected to include a fetchClientDetails function
   * @returns {(context: EffectFunctionContext) => Promise<void>} Async function to load case details and store in context
   */
  LoadCaseDetails: (_deps) => async (context: EffectFunctionContext) => {
    await _deps.effectsWithDeps.LoadCaseDetails(_deps, context);
  },

  /**
   * Loads financial eligibility data from the API and stores it in the context, for use in the journey.
   * @param {unknown} _deps Effect dependencies supplied by Forge, expected to include a getFinancialEligibility function
   * @returns {(context: EffectFunctionContext) => Promise<void>} Async function to load financial eligibility data and store in context
   */
  LoadCaseFinancialEligibility: (_deps) => async (context: EffectFunctionContext) => {
    await _deps.effectsWithDeps.LoadCaseFinancialEligibility(_deps, context);
  },

  /**
   * Submit saved answers from session to cla_backend
   * @param {unknown} _deps Effect dependencies supplied by Forge
   * @returns {(context: EffectFunctionContext) => Promise<void>} Async function to submit saved answers to cla_backend
   */
  PersistSavedAnswers: (_deps) => async (context: EffectFunctionContext) => {
    await _deps.effectsWithDeps.PersistSavedAnswers(_deps, context);
  },

  /**
   * Clears draft financial eligibility answers, in the session
   * @param {unknown} _deps Effect dependencies supplied by Forge
   * @returns {(context: EffectFunctionContext) => void} Function to clear stored draft answers to the context
   */
  ClearDraftAnswers: (_deps) => async (context: EffectFunctionContext) => {
    await _deps.effectsWithDeps.ClearDraftAnswers(_deps, context);
  },

  /**
   * Saves a new answer if it has been answered, by checking the post data for any answers and saving them to the session as drafts
   * @param {unknown} _deps Effect dependencies supplied by Forge
   * @returns {(context: EffectFunctionContext) => void} Function to save new answers to the session as drafts
   */
  SaveNewAnswerIfAnswered: (_deps) => (context: EffectFunctionContext) => {
    _deps.effectsWithDeps.SaveNewAnswerIfAnswered(_deps, context);
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