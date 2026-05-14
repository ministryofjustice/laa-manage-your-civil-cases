import type { EffectFunctionContext } from '@ministryofjustice/hmpps-forge/core/authoring'
import type { Session } from 'express-session'

/**
 * Define what needs to be stored in the session for the financial eligibility
 * questions and answers.
 */

export type FinancialEligibilitySession = Session & {
  financialEligibilityDraft?: Record<string, unknown>
}

export type FinancialEligibilityEffectContext = EffectFunctionContext<
  Record<string, unknown>,
  Record<string, unknown>,
  FinancialEligibilitySession
>