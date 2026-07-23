import { createForgePackage, type ForgePackage } from '@ministryofjustice/hmpps-forge/core/authoring'
import { eligibilityJourney } from './journey.js'
import { FinancialEligibilityEffectsRegistry } from './effects.js'
import { type Deps } from './api.js'

/**
 * Forge package entry point.
 * @returns {ForgePackage} The configured Forge package for the financial eligibility journey
 */
export default createForgePackage<Deps>({
    journey: eligibilityJourney,
    functions: FinancialEligibilityEffectsRegistry,
  })

export * from './api.js'
export * from './authoring.js'
export * from './effects.js'
export * from './context.type.js'
export * from './journey.js'

export * from './checkAnswersPage/checkAnswersStep.js'
export * from './over60Page/over60Step.js'
export * from './under17Page/under17Step.js'
export * from './partnerPage/partnerStep.js'