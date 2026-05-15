import { createForgePackage } from '@ministryofjustice/hmpps-forge/core/authoring'
import { eligibilityJourney } from './journey.js'
import { FinancialEligibilityEffectsImplementations } from './effects.js'

export default createForgePackage({
  journey: eligibilityJourney,
  functions: {
    ...FinancialEligibilityEffectsImplementations
  },
})