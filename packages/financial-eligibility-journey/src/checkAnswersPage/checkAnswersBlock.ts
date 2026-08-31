import { z } from 'zod'
import { Answer, Condition, Conditional, Data, Format, Item, Iterator, Literal, Loop, Transformer, TransformerRegistry, and, not, or } from '@ministryofjustice/hmpps-forge/core/authoring'
import { CollectionBlock } from '@ministryofjustice/hmpps-forge/core/components'
import { GovUKHeading, GovUKSummaryList, GovUKUtilityClasses } from '@ministryofjustice/hmpps-forge/govuk-components'
import { disregardsLookupItems } from '../disregardsPage/disregardsBlock.js'
import { frequencyText, lastCalendarMonthDate } from '../moneyFieldHelpers.js'
import { partnerField } from '../partnerPage/partnerBlock.js'
import { Transformers } from '../formatters.js'

const under18Passported = and(
  Answer('under-18').match(Condition.Equals('yes')),
  Answer('under-18-receives-regular-payment').match(Condition.Equals('no')),
  Answer('under-18-has-valuables').match(Condition.Equals('no')),
)

// Receiving any of these passporting benefits means income/expenses questions are skipped in the journey (see disregardsStep).
const benefitsPassported = or(
  Answer('universal-credit').match(Condition.Equals('yes')),
  Answer('income-support').match(Condition.Equals('yes')),
  Answer('income-based-jsa').match(Condition.Equals('yes')),
  Answer('pension-credit').match(Condition.Equals('yes')),
  Answer('employment-support').match(Condition.Equals('yes')),
)

const incomeOrExpensesSkipped = or(under18Passported, benefitsPassported)

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
      visibleWhen: and(
        Answer('under-18').match(Condition.Equals('yes')),
        Answer('under-18-receives-regular-payment').match(Condition.Equals('no')),
      ),
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
            value: { text: Item().path('value').pipe(Transformers.Currency()) },
          },
          {
            key: { text: 'How much is left to pay on the mortgage?' },
            value: { text: Item().path('mortgage-left').pipe(Transformers.Currency()) },
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

export const savingsSummaryList = GovUKSummaryList({
  visibleWhen: not(under18Passported),
  card: {
    title: {
      text: "Your savings"
    },
    actions: {
      items: [
        { href: 'your-savings', text: 'Change', visuallyHiddenText: 'Change, Your savings' },
      ],
    },
  },
  rows: [
    {
      key: {
        text: 'How much was in your bank account/building society before your last payment went in?',
        classes: GovUKUtilityClasses.Width.TwoThirds,
      },
      value: { text: Answer('bank-balance').pipe(Transformers.Currency()) },
    },
    {
      key: { text: 'Do you have any investments, shares or ISAs?' },
      value: { text: Answer('investment-balance').pipe(Transformers.Currency()) },
    },
    {
      key: { text: 'Do you have any valuable items worth over £500 each?' },
      value: { text: Answer('asset-balance').pipe(Transformers.Currency()) },
    },
    {
      key: { text: 'Do you have any money owed to you?' },
      value: { text: Answer('credit-balance').pipe(Transformers.Currency()) },
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
      value: { text: Answer('bank-balance-partner').pipe(Transformers.Currency()) },
    },
    {
      key: { text: 'Does your partner have any investments, shares or ISAs?' },
      value: { text: Answer('investment-balance-partner').pipe(Transformers.Currency()) },
    },
    {
      key: { text: 'Does your partner have any valuable items worth over £500 each?' },
      value: { text: Answer('asset-balance-partner').pipe(Transformers.Currency()) },
    },
    {
      key: { text: 'Does your partner have any money owed to them?' },
      value: { text: Answer('credit-balance-partner').pipe(Transformers.Currency()) },
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
      value: { text: Answer('bank-balance-disputed').pipe(Transformers.Currency()) },
    },
    {
      key: { text: 'Do you have any investments, shares or ISAs?' },
      value: { text: Answer('investment-balance-disputed').pipe(Transformers.Currency()) },
    },
    {
      key: { text: 'Do you have any valuable items worth over £500 each?' },
      value: { text: Answer('asset-balance-disputed').pipe(Transformers.Currency()) },
    },
    {
      key: { text: 'Do you have any money owed to you?' },
      value: { text: Answer('credit-balance-disputed').pipe(Transformers.Currency()) },
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
        text: 'Disregards selected',
        classes: GovUKUtilityClasses.Width.OneQuarter,
      },
      value: {
        html: Conditional({
          when: Answer('disregards').match(Condition.Equals('none')),
          then: 'None',
          else: Literal(disregardsLookupItems)
            .each(Iterator.Filter(Item().path('value').match(Condition.Array.IsIn(Answer('disregards')))))
            .each(Iterator.Map(Item().path('text')))
            .pipe(Transformer.Array.Join('<br><br>')),
        }),
      },
    },
  ] as GovUKSummaryList['rows'],
})

export const incomeHeading = GovUKHeading({
  visibleWhen: not(incomeOrExpensesSkipped),
  text: 'Income',
  size: 'm',
})

export const incomeSummaryList = GovUKSummaryList({
  visibleWhen: not(incomeOrExpensesSkipped),
  card: {
    title: {
      text: "Your income"
    },
    actions: {
      items: [
        { href: 'your-income', text: 'Change', visuallyHiddenText: 'Change, Income' },
      ],
    },
  },
  rows: [
    {
      key: {
        text: 'Are you self employed?',
        classes: GovUKUtilityClasses.Width.TwoThirds,
      },
      value: { text: Answer('self-employed').pipe(Transformer.String.Capitalize()) },
    },
    {
      key: { text: 'What did you earn before tax?' },
      value: { text: Format('%1 (%2)', Answer('earnings').pipe(Transformers.Currency()), frequencyText('earnings-frequency')) },
    },
    {
      key: { text: 'How much tax do you pay?' },
      value: { text: Format('%1 (%2)', Answer('income-tax').pipe(Transformers.Currency()), frequencyText('income-tax-frequency')) },
    },
    {
      key: { text: 'How much National Insurance do you pay?' },
      value: { text: Format('%1 (%2)', Answer('national-insurance').pipe(Transformers.Currency()), frequencyText('national-insurance-frequency')) },
    },
    {
      key: { text: 'Self employed drawings (Before Tax)' },
      value: { text: Format('%1 (%2)', Answer('self-employment-drawings').pipe(Transformers.Currency()), frequencyText('self-employment-drawings-frequency')) },
    },
    {
      key: { text: 'Benefits' },
      value: { text: Format('%1 (%2)', Answer('income-benefits').pipe(Transformers.Currency()), frequencyText('income-benefits-frequency')) },
    },
    {
      key: { text: 'Tax credits' },
      value: { text: Format('%1 (%2)', Answer('tax-credits').pipe(Transformers.Currency()), frequencyText('tax-credits-frequency')) },
    },
    {
      key: { text: 'Maintenance received' },
      value: { text: Format('%1 (%2)', Answer('maintenance-received').pipe(Transformers.Currency()), frequencyText('maintenance-received-frequency')) },
    },
    {
      key: { text: 'Pension income' },
      value: { text: Format('%1 (%2)', Answer('pension-income').pipe(Transformers.Currency()), frequencyText('pension-income-frequency')) },
    },
    {
      key: { text: 'Other income' },
      value: { text: Format('%1 (%2)', Answer('other-income').pipe(Transformers.Currency()), frequencyText('other-income-frequency')) },
    },
  ] as GovUKSummaryList['rows'],
})

export const partnerIncomeSummaryList = GovUKSummaryList({
  visibleWhen: and(
    Answer(partnerField.code).match(Condition.Equals('yes')),
    not(incomeOrExpensesSkipped)
  ),
  card: {
    title: {
      text: "Your partner\'s income"
    },
    actions: {
      items: [
        { href: 'partner-income', text: 'Change', visuallyHiddenText: 'Change, Your partner\'s income' },
      ],
    },
  },
  rows: [
    {
      key: {
        text: 'Is your partner self employed?',
        classes: GovUKUtilityClasses.Width.TwoThirds,
      },
      value: { text: Answer('self-employed-partner').pipe(Transformer.String.Capitalize()) },
    },
    {
      key: { text: 'What did your partner earn before tax?' },
      value: { text: Format('%1 (%2)', Answer('earnings-partner').pipe(Transformers.Currency()), frequencyText('earnings-partner-frequency')) },
    },
    {
      key: { text: 'How much tax does your partner pay?' },
      value: { text: Format('%1 (%2)', Answer('income-tax-partner').pipe(Transformers.Currency()), frequencyText('income-tax-partner-frequency')) },
    },
    {
      key: { text: 'How much National Insurance does your partner pay?' },
      value: { text: Format('%1 (%2)', Answer('national-insurance-partner').pipe(Transformers.Currency()), frequencyText('national-insurance-partner-frequency')) },
    },
    {
      key: { text: 'Self employed drawings (Before Tax)' },
      value: { text: Format('%1 (%2)', Answer('self-employment-drawings-partner').pipe(Transformers.Currency()), frequencyText('self-employment-drawings-partner-frequency')) },
    },
    {
      key: { text: 'Benefits' },
      value: { text: Format('%1 (%2)', Answer('income-benefits-partner').pipe(Transformers.Currency()), frequencyText('income-benefits-partner-frequency')) },
    },
    {
      key: { text: 'Tax credits' },
      value: { text: Format('%1 (%2)', Answer('tax-credits-partner').pipe(Transformers.Currency()), frequencyText('tax-credits-partner-frequency')) },
    },
    {
      key: { text: 'Maintenance received' },
      value: { text: Format('%1 (%2)', Answer('maintenance-received-partner').pipe(Transformers.Currency()), frequencyText('maintenance-received-partner-frequency')) },
    },
    {
      key: { text: 'Pension income' },
      value: { text: Format('%1 (%2)', Answer('pension-income-partner').pipe(Transformers.Currency()), frequencyText('pension-income-partner-frequency')) },
    },
    {
      key: { text: 'Other income' },
      value: { text: Format('%1 (%2)', Answer('other-income-partner').pipe(Transformers.Currency()), frequencyText('other-income-partner-frequency')) },
    },
  ] as GovUKSummaryList['rows'],
})

export const dependantsSummaryList = GovUKSummaryList({
  visibleWhen: not(incomeOrExpensesSkipped),
  card: {
    title: {
      text: "Dependants"
    },
    actions: {
      items: [
        { href: 'dependants', text: 'Change', visuallyHiddenText: 'Change, Dependants' },
      ],
    },
  },
  rows: [
    {
      key: {
        text: 'Do you have any dependants aged 16 and over?',
        classes: GovUKUtilityClasses.Width.TwoThirds,
      },
      value: { text: Answer('dependants-16-over') },
    },
    {
      key: { text: 'Do you have any dependants aged 15 and under?' },
      value: { text: Answer('dependants-15-under') },
    },
  ] as GovUKSummaryList['rows'],
})

export const expensesHeading = GovUKHeading({
  visibleWhen: not(incomeOrExpensesSkipped),
  text: 'Expenses',
  size: 'm',
})

export const expensesSummaryList = GovUKSummaryList({
  visibleWhen: not(incomeOrExpensesSkipped),
  card: {
    title: {
      text: "Your expenses"
    },
    actions: {
      items: [
        { href: 'your-expenses', text: 'Change', visuallyHiddenText: 'Change, Expenses' },
      ],
    },
  },
  rows: [
    {
      key: {
        text: 'How much do you pay for your mortgage?',
        classes: GovUKUtilityClasses.Width.TwoThirds,
      },
      value: { text: Format('%1 (%2)', Answer('mortgage').pipe(Transformers.Currency()), frequencyText('mortgage-frequency')) },
    },
    {
      key: { text: 'How much do you pay for rent? The amount entered should not include any housing benefit or payments for bills.' },
      value: { text: Format('%1 (%2)', Answer('rent').pipe(Transformers.Currency()), frequencyText('rent-frequency')) },
    },
    {
      key: { text: Format('How much maintenance have you paid during the last calendar month (today back to %1)?', lastCalendarMonthDate()) },
      value: { text: Format('%1 (%2)', Answer('maintenance-paid').pipe(Transformers.Currency()), frequencyText('maintenance-paid-frequency')) },
    },
    {
      key: { text: 'Do you have any childcare costs because of work or study? If so, how much?' },
      value: { text: Format('%1 (%2)', Answer('childcare-costs').pipe(Transformers.Currency()), frequencyText('childcare-costs-frequency')) },
    },
    {
      key: { text: Format('Are you currently paying towards legal aid for criminal defence? If so, how much have you paid during the last calendar month (today back to %1)?', lastCalendarMonthDate()) },
      value: { text: Format('%1 (Per month)', Answer('legal-aid-contributions').pipe(Transformers.Currency())) },
    },
  ] as GovUKSummaryList['rows'],
})

export const partnerExpensesSummaryList = GovUKSummaryList({
  visibleWhen: and(
    Answer(partnerField.code).match(Condition.Equals('yes')),
    not(incomeOrExpensesSkipped)
  ),
  card: {
    title: {
      text: "Your partner\'s expenses"
    },
    actions: {
      items: [
        { href: 'partner-expenses', text: 'Change', visuallyHiddenText: 'Change, Your partner\'s expenses' },
      ],
    },
  },
  rows: [
    {
      key: {
        text: 'How much does your partner pay for their mortgage?',
        classes: GovUKUtilityClasses.Width.TwoThirds,
      },
      value: { text: Format('%1 (%2)', Answer('mortgage-partner').pipe(Transformers.Currency()), frequencyText('mortgage-partner-frequency')) },
    },
    {
      key: { text: 'How much does your partner pay for their rent? The amount entered should not include any housing benefit or payment for bills' },
      value: { text: Format('%1 (%2)', Answer('rent-partner').pipe(Transformers.Currency()), frequencyText('rent-partner-frequency')) },
    },
    {
      key: { text: Format('How much maintenance has your partner paid during the last calendar month (today back to %1)?', lastCalendarMonthDate()) },
      value: { text: Format('%1 (%2)', Answer('maintenance-paid-partner').pipe(Transformers.Currency()), frequencyText('maintenance-paid-partner-frequency')) },
    },
    {
      key: { text: 'Does your partner have any childcare costs because of work or study? If so, how much?' },
      value: { text: Format('%1 (%2)', Answer('childcare-costs-partner').pipe(Transformers.Currency()), frequencyText('childcare-costs-partner-frequency')) },
    },
    {
      key: { text: Format('Is your partner currently paying towards legal aid for criminal defence? If so, how much has your partner paid in the last calendar month (today back to %1)?', lastCalendarMonthDate()) },
      value: { text: Format('%1 (Per month)', Answer('legal-aid-contributions-partner').pipe(Transformers.Currency())) },
    },
  ] as GovUKSummaryList['rows'],
})
