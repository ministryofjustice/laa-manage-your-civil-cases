import { createForgePackage } from '@ministryofjustice/hmpps-forge/core/authoring'
import { feedbackJourney } from '#src/journeys/financial-eligibility/journey.js'
import { FinancialEligibilityEffectsImplementations } from '../effects.js'

export default createForgePackage({
  journey: feedbackJourney,
  functions: {
    ...FinancialEligibilityEffectsImplementations
  },
})