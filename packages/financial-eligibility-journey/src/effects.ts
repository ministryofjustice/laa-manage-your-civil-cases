import { EffectRegistry } from "@ministryofjustice/hmpps-forge/core/authoring";
import { access, redirect, Condition, Session } from '@ministryofjustice/hmpps-forge/core/authoring'
import type { EffectFunctionContext, EffectFunctionExpr } from "@ministryofjustice/hmpps-forge/core/authoring";
import { type Deps } from '@ministryofjustice/financial-eligibility-journey';

export interface FinancialEligibilityEffectShape {
  /** Clears draft answers for this pattern (used after committing drafts to the store). */
  ClearDraftAnswers: () => EffectFunctionExpr;
  /** Submit saved answers from session to cla_backend  */
  PersistSavedAnswers: () => EffectFunctionExpr;
  /** Loads case details from the API and stores them in the context, for use in the journey. */
  LoadCaseDetails: () => EffectFunctionExpr;
  /** Loads financial eligibility data from the API, checks if any questions have been answered so that they take precedence over the API data, and stores the results in Forge's answers. */
  LoadCaseFinancialEligibility: () => EffectFunctionExpr;
  /** Saves a new answer if it has been answered */
  SaveNewAnswerIfAnswered: () => EffectFunctionExpr;
}

type FinancialEligibilityEffectImplementation = (
  deps: Deps,
) => (context: EffectFunctionContext) => void | Promise<void>;

export const FinancialEligibilityEffectsImplementations: Record<
  keyof FinancialEligibilityEffectShape,
  FinancialEligibilityEffectImplementation
> = {
  /**
   * Loads case details from the API and stores them in the context, for use in the journey.
   * @param {unknown} deps Effect dependencies supplied by Forge, expected to include a fetchClientDetails function
   * @returns {(context: EffectFunctionContext) => Promise<void>} Async function to load case details and store in context
   */
  LoadCaseDetails: (deps) => async (context: EffectFunctionContext) => {
    await deps.effectsWithDeps.LoadCaseDetails(deps, context);
  },

  /**
   * Loads financial eligibility data from the API, checks if any questions have been answered so that they take precedence over the API data, and stores the results in Forge's answers.
   * @param {unknown} deps Effect dependencies supplied by Forge, expected to include a getFinancialEligibility function
   * @returns {(context: EffectFunctionContext) => Promise<void>} Async function to load financial eligibility data and store in context
   */
  LoadCaseFinancialEligibility: (deps) => async (context: EffectFunctionContext) => {
    await deps.effectsWithDeps.LoadCaseFinancialEligibility(deps, context);
  },

  /**
   * Submit saved answers from session to cla_backend
   * @param {unknown} deps Effect dependencies supplied by Forge
   * @returns {(context: EffectFunctionContext) => Promise<void>} Async function to submit saved answers to cla_backend
   */
  PersistSavedAnswers: (deps) => async (context: EffectFunctionContext) => {
    await deps.effectsWithDeps.PersistSavedAnswers(deps, context);
  },

  /**
   * Clears draft financial eligibility answers, in the session
   * @param {unknown} deps Effect dependencies supplied by Forge
   * @returns {(context: EffectFunctionContext) => void} Function to clear stored draft answers to the context
   */
  ClearDraftAnswers: (deps) => async (context: EffectFunctionContext) => {
    await deps.effectsWithDeps.ClearDraftAnswers(deps, context);
  },

  /**
   * Saves a new answer if it has been answered, by checking the post data for any answers and saving them to the session as drafts
   * @param {unknown} deps Effect dependencies supplied by Forge
   * @returns {(context: EffectFunctionContext) => void} Function to save new answers to the session as drafts
   */
  SaveNewAnswerIfAnswered: (deps) => (context: EffectFunctionContext) => {
    void deps.effectsWithDeps.SaveNewAnswerIfAnswered(deps, context);
  }

};

export const FinancialEligibilityEffectsRegistry = new EffectRegistry<Deps>();

export const FinancialEligibilityEffects: FinancialEligibilityEffectShape = {
  LoadCaseDetails: FinancialEligibilityEffectsRegistry.register(
    'LoadCaseDetails',
    FinancialEligibilityEffectsImplementations.LoadCaseDetails,
  ),
  LoadCaseFinancialEligibility: FinancialEligibilityEffectsRegistry.register(
    'LoadCaseFinancialEligibility',
    FinancialEligibilityEffectsImplementations.LoadCaseFinancialEligibility,
  ),
  PersistSavedAnswers: FinancialEligibilityEffectsRegistry.register(
    'PersistSavedAnswers',
    FinancialEligibilityEffectsImplementations.PersistSavedAnswers,
  ),
  ClearDraftAnswers: FinancialEligibilityEffectsRegistry.register(
    'ClearDraftAnswers',
    FinancialEligibilityEffectsImplementations.ClearDraftAnswers,
  ),
  SaveNewAnswerIfAnswered: FinancialEligibilityEffectsRegistry.register(
    'SaveNewAnswerIfAnswered',
    FinancialEligibilityEffectsImplementations.SaveNewAnswerIfAnswered,
  ),
};

/**
 * Make sure that these pages can't be viewed unless logged in
 * @returns {EffectFunctionExpr} Access control definition that enforces authentication
 */
export const requireAuth = () =>
  access({
    next: [
      redirect({
        when: Session('silasAuth').not.match(Condition.IsRequired()),
        goto: '/',
      }),
    ],
  })