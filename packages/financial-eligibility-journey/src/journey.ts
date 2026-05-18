import { journey, step, submit, redirect } from '@ministryofjustice/hmpps-forge/core/authoring'
import {
  GovUKTextInput,
  GovUKTextareaInput,
  GovUKButton,
  GovUKPanel,
} from '@ministryofjustice/hmpps-forge/govuk-components'
import { FinancialEligibilityEffects } from './effects.js'

const nameStep = step({
  path: '/',
  title: 'What is your name?',
  reachability: { entryWhen: true },
  // TODO: Instead of blocks, use view to render our own template?
  blocks: [
    GovUKTextInput({
      code: 'fullName',
      label: {
        text: 'What is your name?',
        isPageHeading: true,
        classes: 'govuk-label--l',
      },
    }),
    GovUKButton({ text: 'Continue' }),
  ],
  onSubmission: [
    submit({
      validate: true,
      onValid: {
        effects: [FinancialEligibilityEffects.SaveDraftAnswers()],
        next: [redirect({ goto: 'your-feedback' })],
      },
    }),
  ],
})

const feedbackStep = step({
  code: 'your-feedback',
  path: '/your-feedback',
  title: 'Your feedback',
  reachability: { entryWhen: true },
  blocks: [
    GovUKTextareaInput({
      code: 'feedback',
      label: {
        text: 'Your feedback',
        isPageHeading: true,
        classes: 'govuk-label--l',
      },
      hint: { text: 'Tell us what you think of this service.' },
    }),
    GovUKButton({ text: 'Send feedback' }),
  ],
  onSubmission: [
    submit({
      validate: true,
      onValid: {
        effects: [FinancialEligibilityEffects.SaveDraftAnswers()],
        next: [redirect({ goto: 'confirmation' })],
      },
    }),
  ],
})

const confirmationStep = step({
  path: '/confirmation',
  title: 'Feedback sent',
  blocks: [
    GovUKPanel({ titleText: 'Feedback sent' }),
  ],
})

export const feedbackJourney = journey({
  code: 'feedback',
  title: 'Give feedback',
  path: '/feedback',
  view: { template: 'case_details/financial_eligibility/forge-form' },
  steps: [nameStep, feedbackStep, confirmationStep],
})
