import { EffectRegistry } from "@ministryofjustice/hmpps-forge/core/authoring";
import type { EffectFunctionContext, EffectFunctionExpr } from "@ministryofjustice/hmpps-forge/core/authoring";
import { type Deps } from '@ministryofjustice/financial-eligibility-journey';
import type { FinancialEligibilitySession } from './context.type.js';
import { getOrMigrateCasePatternDrafts } from './casePatternDrafts.js';

export interface FinancialEligibilityEffectShape {  
  /** Clears draft answers for this pattern (used after committing drafts to the store) */
  ClearDraftAnswers: () => EffectFunctionExpr;
  /** Submit saved answers from session to cla_backend  */
  PersistSavedAnswers: () => EffectFunctionExpr;
  /** Loads case details from middleware (already fetched by fetchClientDetails) and stores them in the context for use in the journey */
  LoadCaseDetails: () => EffectFunctionExpr;
  /** Loads financial eligibility data from the API, checks if any questions have been answered so that they take precedence over the API data, and stores the results in Forge's answers */
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
   * Loads case details from middleware and stores them in the context, for use in the journey.
   * The data has already been fetched by fetchClientDetails middleware to avoid duplicate API calls.
   * @param {unknown} deps Effect dependencies supplied by Forge
   * @returns {(context: EffectFunctionContext) => Promise<void>} Async function to load case details from state
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
  },
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

// Pattern effect shape and implementations
export interface PatternEffectShape {
  /** Loads a repeating collection from the session, sets it as Data for the iterator, and restores indexed field answers */
  InitialiseRepeatingFieldset: (patternCode: string, collectionCode: string, fieldCodes: string[]) => EffectFunctionExpr;
  /** Saves current indexed field values to the session collection, appends an empty item, and restores answers with new indices */
  AddRepeatingItem: (patternCode: string, collectionCode: string, fieldCodes: string[]) => EffectFunctionExpr;
  /** Saves current indexed field values, removes the item whose index matches the POST action value, and re-indexes answers */
  RemoveRepeatingItem: (patternCode: string, collectionCode: string, fieldCodes: string[]) => EffectFunctionExpr;
  /** Reads current indexed field values into the session collection for persistence across requests */
  SaveRepeatingItems: (patternCode: string, collectionCode: string, fieldCodes: string[]) => EffectFunctionExpr;
}

// Type for pattern effect context
type PatternEffectContext = EffectFunctionContext;

/**
 * Gets the `caseReference` from url parameters
 * @param {PatternEffectContext} context The effect function context containing request parameters
 * @returns {string | undefined} The case reference string if valid, otherwise undefined
 */
function getCaseReference(context: PatternEffectContext): string | undefined {
  const caseReference = context.getRequestParam('caseReference')
  if (typeof caseReference !== 'string' || caseReference.length === 0) {
    return undefined
  }

  return caseReference
}

// Taken from Forge example in their documentation
const PatternEffectImplementations = {
  /** Loads a repeating collection from the session, sets it as Data for the iterator, and restores indexed field answers. */
  InitialiseRepeatingFieldset: FinancialEligibilityEffectsRegistry.register(
    'InitializeRepeatingFieldset',
    () =>
      (
        context: PatternEffectContext,
        patternCode: string,
        collectionCode: string,
        fieldCodes: string[],
      ) => {
        const session = context.getSession() as FinancialEligibilitySession | undefined
        const caseReference = getCaseReference(context)
        if (!session || !caseReference) {
          return
        }

        const casePatternDrafts = getOrMigrateCasePatternDrafts(session, caseReference)
        const stored = casePatternDrafts[patternCode]
        const collection = (stored?.[collectionCode] ?? []) as Record<string, unknown>[]

        if (collection.length === 0) {
          return
        }

        context.setData(collectionCode, collection)

        collection.forEach((item, index) => {
          for (const code of fieldCodes) {
            context.setAnswer(`${code}_${index}`, (item[code] as string) ?? '')
          }
        })
      },
  ),

  /** Saves current indexed field values to the session collection, appends an empty item, and restores answers with new indices */
  AddRepeatingItem: FinancialEligibilityEffectsRegistry.register(
    'AddRepeatingItem',
    () =>
      (
        context: PatternEffectContext,
        patternCode: string,
        collectionCode: string,
        fieldCodes: string[],
      ) => {
        const session = context.getSession() as FinancialEligibilitySession | undefined
        const caseReference = getCaseReference(context)

        if (!session || !caseReference) {
          return
        }

        const casePatternDrafts = getOrMigrateCasePatternDrafts(session, caseReference)
        if (!casePatternDrafts[patternCode]) {
          casePatternDrafts[patternCode] = {}
        }

        const stored = casePatternDrafts[patternCode]
        const collection = (stored[collectionCode] ??
          context.getData(collectionCode) ??
          []) as Record<string, unknown>[]

        const updated = collection.map((item, index) => {
          const merged = { ...item }

          for (const code of fieldCodes) {
            merged[code] = context.getAnswer(`${code}_${index}`) ?? item[code]
          }

          return merged
        })

        updated.push(Object.fromEntries(fieldCodes.map(code => [code, ''])))
        stored[collectionCode] = updated

        context.setData(collectionCode, updated)

        updated.forEach((item, index) => {
          for (const code of fieldCodes) {
            context.setAnswer(`${code}_${index}`, (item[code] as string) ?? '')
          }
        })
      },
  ),

  /** Saves current indexed field values, removes the item whose index matches the POST action value, and re-indexes answers */
  RemoveRepeatingItem: FinancialEligibilityEffectsRegistry.register(
    'RemoveRepeatingItem',
    () =>
      (
        context: PatternEffectContext,
        patternCode: string,
        collectionCode: string,
        fieldCodes: string[],
      ) => {
        const session = context.getSession() as FinancialEligibilitySession | undefined
        const caseReference = getCaseReference(context)

        if (!session || !caseReference) {
          return
        }

        const casePatternDrafts = getOrMigrateCasePatternDrafts(session, caseReference)
        if (!casePatternDrafts[patternCode]) {
          return
        }

        const stored = casePatternDrafts[patternCode]
        const collection = (stored[collectionCode] ??
          context.getData(collectionCode) ??
          []) as Record<string, unknown>[]

        const actionValue = context.getPostData<string>('action')
        const indexStr = actionValue?.replace('remove_', '') ?? ''
        const index = parseInt(indexStr, 10)

        if (Number.isNaN(index) || index < 0 || index >= collection.length) {
          return
        }

        let updated = collection.map((item, i) => {
          const merged = { ...item }

          for (const code of fieldCodes) {
            merged[code] = context.getAnswer(`${code}_${i}`) ?? item[code]
          }

          return merged
        })

        updated = [...updated.slice(0, index), ...updated.slice(index + 1)]

        stored[collectionCode] = updated

        context.setData(collectionCode, updated)

        updated.forEach((item, i) => {
          for (const code of fieldCodes) {
            context.setAnswer(`${code}_${i}`, (item[code] as string) ?? '')
          }
        })
      },
  ),

  /** Reads current indexed field values into the session collection for persistence across requests */
  SaveRepeatingItems: FinancialEligibilityEffectsRegistry.register(
    'SaveRepeatingItems',
    () =>
      (
        context: PatternEffectContext,
        patternCode: string,
        collectionCode: string,
        fieldCodes: string[],
      ) => {
        const session = context.getSession() as FinancialEligibilitySession | undefined
        const caseReference = getCaseReference(context)

        if (!session || !caseReference) {
          return
        }

        const casePatternDrafts = getOrMigrateCasePatternDrafts(session, caseReference)
        if (!casePatternDrafts[patternCode]) {
          casePatternDrafts[patternCode] = {}
        }

        const stored = casePatternDrafts[patternCode]
        const collection = (stored[collectionCode] ??
          context.getData(collectionCode) ??
          []) as Record<string, unknown>[]

        stored[collectionCode] = collection.map((item, index) => {
          const merged = { ...item }

          for (const code of fieldCodes) {
            merged[code] = context.getAnswer(`${code}_${index}`) ?? item[code]
          }

          return merged
        })
      },
  ),
};

export const PatternEffects: PatternEffectShape = {
  InitialiseRepeatingFieldset: PatternEffectImplementations.InitialiseRepeatingFieldset,
  AddRepeatingItem: PatternEffectImplementations.AddRepeatingItem,
  RemoveRepeatingItem: PatternEffectImplementations.RemoveRepeatingItem,
  SaveRepeatingItems: PatternEffectImplementations.SaveRepeatingItems,
};
