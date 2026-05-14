import { createForgePackage } from '@ministryofjustice/hmpps-forge/core/authoring'
import { feedbackJourney } from '#src/journeys/my-journey/journey.js'
import { FinancialEligibilityEffectsImplementations } from '../effects.js'

export default createForgePackage({
  journey: feedbackJourney,
  functions: {
    ...FinancialEligibilityEffectsImplementations
  },
})