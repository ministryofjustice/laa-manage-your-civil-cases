import type { EffectFunctionContext } from '@ministryofjustice/hmpps-forge/core/authoring'
import type { Session } from 'express-session'

/**
 * Define what needs to be stored in the session for the financial eligibility
 * questions and answers.
 */

export type FinancialEligibilitySession = Session & {
  financialEligibilityDrafts: Record<string, Record<string, unknown>>; // session-stored draft answers for financial eligibility questions, keyed by case reference
  casePatternDrafts?: Record<string, Record<string, Record<string, unknown[]>>>;  // session-stored draft answers for repeating pattern data in the financial eligibility journey
}

export type FinancialEligibilityEffectContext = EffectFunctionContext<
  Record<string, unknown>,
  Record<string, unknown>,
  FinancialEligibilitySession
>