import { type Route } from '../../@types'
import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'
import { Compliance } from '../../data/model/overview'
import { type OutcomeTicket } from '../../models/Locals'
import { dateWithYear } from '../../utils'

type PriorBreachOrRecallCountKey = keyof Pick<
  Compliance,
  'priorBreachesOnCurrentOrderCount' | 'priorRecallsOnCurrentOrderCount'
>

export const getTicket = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (_req, res, next) => {
    let ticket: OutcomeTicket | null = null
    const { forename, sentence, crn, reqUrl } = res.locals.appointmentOutcome
    if (!sentence) {
      res.locals.appointmentOutcome.ticket = null
      return next()
    }
    const { compliance, order, type } = sentence
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const { acceptableAbsence, unacceptableAbsence, attendedButDidNotComply } =
      await masClient.getPersonNonComplianceDetail(crn)

    const priorBreachOrRecallCountKey: PriorBreachOrRecallCountKey =
      type === 'COMMUNITY' ? 'priorBreachesOnCurrentOrderCount' : 'priorRecallsOnCurrentOrderCount'

    const breachOrRecall = type === 'COMMUNITY' ? 'breach' : 'recall'
    const today = new Date()
    const oneYearAgo = new Date(today)
    oneYearAgo.setFullYear(today.getFullYear() - 1)

    const formatDate = (date: Date) => `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`

    const dateFrom= formatDate(oneYearAgo)
    const dateTo= formatDate(today)

    // attended failed to comply page, unacceptable absence page 👈
    if (['attended-failed-to-comply', 'unacceptable-absence'].some(url => reqUrl.endsWith(url))) {
      const failureToComplyContacts = [...unacceptableAbsence, ...attendedButDidNotComply]

      // one previous FTC, no previous breach or recall 👇

      if (failureToComplyContacts?.length === 1 && compliance?.[priorBreachOrRecallCountKey] === 0) {
        const { contactId, date } = failureToComplyContacts.at(0)
        ticket = {
          title: `This is ${forename}’s second count of non-compliance in the past 12 months`,
          html: `
          <p class="govuk-body">You should consider initiating a ${breachOrRecall}.</p>
          <p class="govuk-body govuk-!-margin-bottom-2">${forename} also failed to comply with:</p>
          <ul class="govuk-list govuk-list--bullet">
            <li>
              <a class="govuk-link" href="/case/${crn}/appointments/appointment/${contactId}/manage" target="_blank" rel="noopener noreferrer">${dateWithYear(date)}: ${order} (opens in new tab)</a>
            </li>
          </ul>
          `,
          type: 'RED',
        }
      }

      // more than one previous FTC, no previous breach or recall 👇

      if (failureToComplyContacts?.length > 1 && compliance?.[priorBreachOrRecallCountKey] === 0) {
        ticket = {
          title: `${forename} has had multiple counts of non-compliance in the past 12 months`,
          html: `<p class="govuk-body">You should consider initiating a ${breachOrRecall}.</p>
          <p class="govuk-body"><a class="govuk-link" href="/case/${crn}/activitylog/redirect?keywords=&compliance=not+complied&submit=true&view=&page=0" target="_blank" rel="noopener noreferrer">View a list of ${forename}’s non-compliance (opens in new tab)</a>.</p>`,
          type: 'RED',
        }
      }

      // more than one previous FTC, previous breach or recall

      if (failureToComplyContacts?.length > 1 && compliance?.[priorBreachOrRecallCountKey] > 0) {
        ticket = {
          title: `${forename} has had multiple counts of non-compliance in the past 12 months`,
          html: `
          <p class="govuk-body govuk-!-margin-bottom-2">${forename} has ${type === 'COMMUNITY' ? 'breached this sentence' : 'been recalled'} before. You can:</p>
          <ul class="govuk-list govuk-list--bullet">
            <li>
              <a class="govuk-link" href="/case/${crn}/activitylog/redirect?keywords=&compliance=not+complied&submit=true&view=&page=0" target="_blank" rel="noopener noreferrer">view ${forename}’s failures to comply (opens in new tab)</a>
            </li>
            <li>
              <a class="govuk-link" href="/case/${crn}/compliance" target="_blank" rel="noopener noreferrer">view ${forename}’s previous breach information (opens in new tab)</a>
            </li>
          </ul>
          `,
          type: 'RED',
        }
      }
    }

    // acceptable absence page 👈

    if (reqUrl.endsWith('outcome/acceptable-absence') && acceptableAbsence?.length > 1) {
      ticket = {
        title: `${forename} has had multiple acceptable absences in the past 12 months`,
        html: `<p class="govuk-body">You can view a <a class="govuk-link" href="/case/${crn}/activitylog/redirect?keywords=&dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}&compliance=complied&submit=true&view=&page=0" target="_blank" rel="noopener noreferrer">list of ${forename}’s acceptable absences (opens in new tab)</a>.`,
        type: 'BLUE',
      }
    }
    res.locals.appointmentOutcome.ticket = ticket
    return next()
  }
}
