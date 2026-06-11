import { createForgePackage, createFunctionsRegistry, type ForgePackage } from '@ministryofjustice/hmpps-forge/core/authoring'
import { eligibilityJourney } from './journey.js'
import { type Deps, FinancialEligibilityEffectsImplementations } from './effects.js'


/**
 * Forge package entry point.
 * @returns {ForgePackage} The configured Forge package for the financial eligibility journey
 */
export default createForgePackage<Deps>({
    journey: eligibilityJourney,
    functions: {
      ...FinancialEligibilityEffectsImplementations
    },
  })

export * from './api.js'
