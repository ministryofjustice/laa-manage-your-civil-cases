import { Answer, Condition, Transformer, and, not } from '@ministryofjustice/hmpps-forge/core/authoring'
import { GovUKSummaryList, GovUKUtilityClasses } from '@ministryofjustice/hmpps-forge/govuk-components'

export const aboutYouSummaryList = GovUKSummaryList({
  card: {
    title: {
      text: "About you"
    },
    actions: {
      items: [
        { href: 'under-18', text: 'Change', visuallyHiddenText: 'Change, About you' },
      ],
    },
  },
  rows: [
    {
      key: {
        text: 'Are you aged 17 or under?',
        classes: GovUKUtilityClasses.Width.TwoThirds,
      },
      value: {
        text: Answer('under-18').pipe(Transformer.String.Capitalize())
      },
    },
    {
      key: { text: 'Do you receive any money on a regular basis?' },
      value: { text: Answer('under-18-receives-regular-payment').pipe(Transformer.String.Capitalize()) },
      visibleWhen: Answer('under-18').match(Condition.Equals('yes')),
    },
    {
      key: { text: 'Do you have any savings, items of value or investments totalling £2500 or more?' },
      value: { text: Answer('under-18-has-valuables').pipe(Transformer.String.Capitalize()) },
      visibleWhen: Answer('under-18-receives-regular-payment').match(Condition.Equals('no')),
    },
    {
      key: { text: 'Do you have a partner?' },
      value: { text: Answer('has-partner').pipe(Transformer.String.Capitalize()) },
      visibleWhen: not(
        and(
          Answer('under-18-receives-regular-payment').match(Condition.Equals('no')),
          Answer('under-18-has-valuables').match(Condition.Equals('no'))
        )
      ),
    },
    {
      key: { text: 'Are you or your partner aged 60 or over?' },
      value: { text: Answer('60-or-over-with-partner').pipe(Transformer.String.Capitalize()) },
      visibleWhen: and(
        Answer('has-partner').match(Condition.Equals('yes')),
        not(
          and(
            Answer('under-18').match(Condition.Equals('yes')),
            Answer('under-18-receives-regular-payment').match(Condition.Equals('no')),
            Answer('under-18-has-valuables').match(Condition.Equals('no'))
          )
        )
      )
    },
    {
      key: { text: 'Are you aged over 60?' },
      value: { text: Answer('60-or-over').pipe(Transformer.String.Capitalize()) },
      visibleWhen: and(
        Answer('has-partner').match(Condition.Equals('no')),
        not(
          and(
            Answer('under-18').match(Condition.Equals('yes')),
            Answer('under-18-receives-regular-payment').match(Condition.Equals('no')),
            Answer('under-18-has-valuables').match(Condition.Equals('no'))
          )
        )
      ),
    },
  ] as GovUKSummaryList['rows'],
})

export const benefitsSummaryList = GovUKSummaryList({
  visibleWhen: not(
    and(
      Answer('under-18').match(Condition.Equals('yes')),
      Answer('under-18-receives-regular-payment').match(Condition.Equals('no')),
      Answer('under-18-has-valuables').match(Condition.Equals('no')),
    ),
  ),
  card: {
    title: {
      text: "Benefits"
    },
    actions: {
      items: [
        { href: 'benefits', text: 'Change', visuallyHiddenText: 'Change, About you' },
      ],
    },
  },
  rows: [
    {
      key: {
        text: 'Universal Credit',
        classes: GovUKUtilityClasses.Width.TwoThirds,
      },
      value: { text: Answer('universal-credit').pipe(Transformer.String.Capitalize()) },
    },
    {
      key: { text: 'Income Support' },
      value: { text: Answer('income-support').pipe(Transformer.String.Capitalize()) },
    },
    {
      key: { text: 'Income-based Job Seekers Allowance' },
      value: { text: Answer('income-based-jsa').pipe(Transformer.String.Capitalize()) },
    },
    {
      key: { text: 'Guarantee State Pension Credit' },
      value: { text: Answer('pension-credit').pipe(Transformer.String.Capitalize()) },
    },
    {
      key: { text: 'Income-related Employment and Support Allowance' },
      value: { text: Answer('employment-support').pipe(Transformer.String.Capitalize()) },
    },
  ] as GovUKSummaryList['rows'],
})