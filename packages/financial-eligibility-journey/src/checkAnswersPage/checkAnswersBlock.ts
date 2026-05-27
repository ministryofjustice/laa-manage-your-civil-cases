import { Answer, Condition, match, Conditional, Transformer} from '@ministryofjustice/hmpps-forge/core/authoring'
import { GovUKSummaryList } from '@ministryofjustice/hmpps-forge/govuk-components'

// under17Label uses match() to pick a friendly display value for the row
// that is always shown. The three branch rows each declare visibleWhen, so
// only the branch the user actually took appears on the summary. Answers
// from other branches stay in the session (so switching back shows the
// previous value pre-filled) but are not displayed here.
const under17Label = match(Answer('under17'))
  .branch(Condition.Equals('yes'), 'Yes')
  .branch(Condition.Equals('no'), 'No')
  .otherwise('')

export const summaryList = GovUKSummaryList({
  card: {
    title: {
      text: "About you"
    }
  },
  rows: [
    {
      key: { text: 'Are you aged 17 or under?' },
      value: { text: under17Label },
      actions: {
        items: [
          { href: 'under-17', text: 'Change', visuallyHiddenText: 'Are you aged 17 or under?' },
        ],
      },
    },
    Conditional({
      when: Answer('under17').match(Condition.Equals('no')),
      then: {
        key: { text: 'Do you have a partner?' },
        value: { text: Answer('partner').pipe(Transformer.String.Capitalize()) },
        actions: {
          items: [{ href: 'partner', text: 'Change', visuallyHiddenText: 'Do you have a partner?' }],
        },
      },
    }),
    Conditional({
      when: Answer('under17').match(Condition.Equals('no')),
      then: {
        key: { text: 'Are you aged 60 or over?' },
        value: { text: Answer('over-60').pipe(Transformer.String.Capitalize()) },
        actions: {
          items: [{ href: 'over-60', text: 'Change', visuallyHiddenText: 'Are you aged 60 or over?' }],
        },
      },
    }),
  ] as GovUKSummaryList['rows'],
})