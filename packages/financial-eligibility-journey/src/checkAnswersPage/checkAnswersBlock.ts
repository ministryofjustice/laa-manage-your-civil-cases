import { Answer, Condition, Conditional, Data, Format, Item, Iterator, Literal, Loop, Transformer, and, not, or } from '@ministryofjustice/hmpps-forge/core/authoring'
import { CollectionBlock } from '@ministryofjustice/hmpps-forge/core/components'
import { GovUKHeading, GovUKSummaryList, GovUKUtilityClasses } from '@ministryofjustice/hmpps-forge/govuk-components'
import { disregardsLookupItems } from '../disregardsPage/disregardsBlock.js'

const under18Passported = and(
  Answer('under-18').match(Condition.Equals('yes')),
  Answer('under-18-receives-regular-payment').match(Condition.Equals('no')),
  Answer('under-18-has-valuables').match(Condition.Equals('no')),
)

const categoryIsDebtOrFamily = or(
  Answer('category').match(Condition.Equals('debt')),
  Answer('category').match(Condition.Equals('family'))
)

export const checkYourAnswersHeading = GovUKHeading({
  text: 'Check your answers',
  size: 'm',
})

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
        not(under18Passported)
      )
    },
    {
      key: { text: 'Are you aged over 60?' },
      value: { text: Answer('60-or-over').pipe(Transformer.String.Capitalize()) },
      visibleWhen: and(
        Answer('has-partner').match(Condition.Equals('no')),
        not(under18Passported)
      ),
    },
  ] as GovUKSummaryList['rows'],
})

export const benefitsSummaryList = GovUKSummaryList({
  visibleWhen: not(under18Passported),
  card: {
    title: {
      text: "Benefits"
    },
    actions: {
      items: [
        { href: 'benefits', text: 'Change', visuallyHiddenText: 'Change, Benefits' },
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

export const financesHeading = GovUKHeading({
  visibleWhen: not(under18Passported),
  text: 'Finances',
  size: 'm',
})

export const propertiesSummaryList = CollectionBlock({
  collection: Data('propertySet').each(
    Iterator.Map([
      GovUKSummaryList({
        visibleWhen: not(under18Passported),
        card: {
          title: {
            text: Format('Property %1', Loop.Index())
          },
          actions: {
            items: [
              { href: 'properties', text: 'Change', visuallyHiddenText: Format('Change, Property %1', Loop.Index()) },
            ],
          },
        },
        rows: [
          {
            key: {
              text: 'What is the current market value of the property?',
              classes: GovUKUtilityClasses.Width.TwoThirds,
            },
            value: { text: Format('£%1', Item().path('value')) },
          },
          {
            key: { text: 'How much is left to pay on the mortgage?' },
            value: { text: Format('£%1', Item().path('mortgage-left')) },
          },
          {
            key: { text: 'Is the property disputed?' },
            value: { text: Item().path('disputed').pipe(Transformer.String.Capitalize()) },
            visibleWhen: categoryIsDebtOrFamily,
          },
          {
            key: { text: 'Is this your main property?' },
            value: { text: Item().path('main').pipe(Transformer.String.Capitalize()) },
          },
          {
            key: { text: 'What percentage of the property do you own?' },
            value: { text: Format('%1%', Item().path('share')) },
          },
        ] as GovUKSummaryList['rows'],
      }),
    ]),
  )
})

export const propertySummaryList = propertiesSummaryList

export const savingsSummaryList = GovUKSummaryList({
  visibleWhen: not(under18Passported),
  card: {
    title: {
      text: "Your savings"
    },
    actions: {
      items: [
        { href: 'savings', text: 'Change', visuallyHiddenText: 'Change, Your savings' },
      ],
    },
  },
  rows: [
    {
      key: {
        text: 'How much was in your bank account/building society before your last payment went in?',
        classes: GovUKUtilityClasses.Width.TwoThirds,
      },
      value: { text: Format('£%1', Answer('bank-balance')) },
    },
    {
      key: { text: 'Do you have any investments, shares or ISAs?' },
      value: { text: Format('£%1', Answer('investment-balance')) },
    },
    {
      key: { text: 'Do you have any valuable items worth over £500 each?' },
      value: { text: Format('£%1', Answer('asset-balance')) },
    },
    {
      key: { text: 'Do you have any money owed to you?' },
      value: { text: Format('£%1', Answer('credit-balance')) },
    },
  ] as GovUKSummaryList['rows'],
})

export const partnerSavingsSummaryList = GovUKSummaryList({
  visibleWhen: and(
    Answer('has-partner').match(Condition.Equals('yes')),
    not(under18Passported)
  ),
  card: {
    title: {
      text: "Your partner\'s savings"
    },
    actions: {
      items: [
        { href: 'partner-savings', text: 'Change', visuallyHiddenText: 'Change, Your partner\'s savings' },
      ],
    },
  },
  rows: [
    {
      key: {
        text: 'How much was in your partner\'s bank account/building society before your last payment went in?',
        classes: GovUKUtilityClasses.Width.TwoThirds,
      },
      value: { text: Format('£%1', Answer('bank-balance-partner')) },
    },
    {
      key: { text: 'Does your partner have any investments, shares or ISAs?' },
      value: { text: Format('£%1', Answer('investment-balance-partner')) },
    },
    {
      key: { text: 'Does your partner have any valuable items worth over £500 each?' },
      value: { text: Format('£%1', Answer('asset-balance-partner')) },
    },
    {
      key: { text: 'Does your partner have any money owed to them?' },
      value: { text: Format('£%1', Answer('credit-balance-partner')) },
    },
  ] as GovUKSummaryList['rows'],
})

export const disputedSavingsSummaryList = GovUKSummaryList({
  visibleWhen: and(
    categoryIsDebtOrFamily,
    not(under18Passported)
  ),
  card: {
    title: {
      text: "Your disputed savings"
    },
    actions: {
      items: [
        { href: 'disputed-savings', text: 'Change', visuallyHiddenText: 'Change, Your disputed savings' },
      ],
    },
  },
  rows: [
    {
      key: {
        text: 'How much was in your bank account/building society before your last payment went in?',
        classes: GovUKUtilityClasses.Width.TwoThirds,
      },
      value: { text: Format('£%1', Answer('bank-balance-disputed')) },
    },
    {
      key: { text: 'Do you have any investments, shares or ISAs?' },
      value: { text: Format('£%1', Answer('investment-balance-disputed')) },
    },
    {
      key: { text: 'Do you have any valuable items worth over £500 each?' },
      value: { text: Format('£%1', Answer('asset-balance-disputed')) },
    },
    {
      key: { text: 'Do you have any money owed to you?' },
      value: { text: Format('£%1', Answer('credit-balance-disputed')) },
    },
  ] as GovUKSummaryList['rows'],
})

export const disregardsSummaryList = GovUKSummaryList({
  visibleWhen: not(under18Passported),
  card: {
    title: {
      text: "Disregards"
    },
    actions: {
      items: [
        { href: 'disregards', text: 'Change', visuallyHiddenText: 'Change, Disregards' },
      ],
    },
  },
  rows: [
    {
      key: {
        text: 'Disregards',
        classes: GovUKUtilityClasses.Width.OneQuarter,
      },
      value: {
        html: Conditional({
          when: Answer('disregards').match(Condition.Equals('none')),
          then: 'None',
          else: Literal(disregardsLookupItems)
            .each(Iterator.Filter(Item().path('value').match(Condition.Array.IsIn(Answer('disregards')))))
            .each(Iterator.Map(Item().path('text')))
            .pipe(Transformer.Array.Join('<br>')),
        }),
      },
    },
  ] as GovUKSummaryList['rows'],
})
