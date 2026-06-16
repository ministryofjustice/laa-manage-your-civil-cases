import { createForgePackage, createFunctionsRegistry, type ForgePackage } from '@ministryofjustice/hmpps-forge/core/authoring'
import { eligibilityJourney } from './journey.js'
import { FinancialEligibilityEffectsImplementations } from './effects.js'
import { type Deps } from './api.js'


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
