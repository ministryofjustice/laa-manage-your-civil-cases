import { createForgePackage } from '@ministryofjustice/hmpps-forge/core/authoring'
import { feedbackJourney } from './journey.js'
import { FinancialEligibilityEffectsImplementations } from './effects.js'

export default createForgePackage({
  journey: feedbackJourney,
  functions: {
    ...FinancialEligibilityEffectsImplementations
  },
})
