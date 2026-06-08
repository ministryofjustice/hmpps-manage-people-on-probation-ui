import { type Route } from '../../@types'
import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'
import { type OutcomeTicket } from '../../models/Locals'

export const getTicket = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (_req, res, next) => {
    let ticket: OutcomeTicket | null = null
    const {
      forename,
      sentence: { compliance },
      crn,
      reqUrl,
    } = res.locals.appointmentOutcome
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const { acceptableAbsence, unacceptableAbsence, attendedButDidNotComply } =
      await masClient.getPersonNonComplianceDetail(crn)

    // attended failed to comply page, unacceptable absence page 👈

    if (['attended-failed-to-comply', 'unacceptable-absence'].some(url => reqUrl.endsWith(url))) {
      const failureToComplyContacts = [...unacceptableAbsence, ...attendedButDidNotComply]

      // one previous FTC, no previous breach 👇

      if (failureToComplyContacts?.length === 1 && compliance.priorBreachesOnCurrentOrderCount === 0) {
        const { contactId } = failureToComplyContacts.at(0)
        ticket = {
          title: `This is ${forename}’s second count of non-compliance in the past 12 months`,
          html: `
          <p class="govuk-body">You should consider initiating a breach.</p>
          <p class="govuk-body govuk-!-margin-bottom-2">${forename} also failed to comply with:</p>
          <ul class="govuk-list govuk-list--bullet">
            <li>
              <a class="govuk-link" href="/case/${crn}/appointments/appointment/${contactId}/manage" target="_blank" rel="noopener noreferrer"> (opens in new tab)</a>
            </li>
          </ul>')
          `,
          type: 'RED',
        }
      }

      // more than one previous FTC, no previous breach 👇

      if (failureToComplyContacts?.length > 1 && compliance.priorBreachesOnCurrentOrderCount === 0) {
        ticket = {
          title: `${forename} has had multiple counts of non-compliance in the past 12 months.`,
          html: `<p class="govuk-body">You should consider initiating a breach. <a class="govuk-link" href="/case/${crn}/activitylog/redirect?keywords=&compliance=not+complied&submit=true&view=&page=0" target="_blank" rel="noopener noreferrer">View a list of ${forename}’s non-compliance (opens in new tab)</a>.</p>',`,
          type: 'RED',
        }
      }

      // more than one previous FTC, previous breach

      if (failureToComplyContacts?.length > 1 && compliance.priorBreachesOnCurrentOrderCount > 0) {
        ticket = {
          title: `${forename} has had multiple counts of non-compliance in the past 12 months.`,
          html: `
          <p class="govuk-body govuk-!-margin-bottom-2">${forename} has breached this sentence before. You can:</p>
          <ul class="govuk-list govuk-list--bullet">
            <li>
              <a class="govuk-link" href="/case/${crn}/activitylog/redirect?keywords=&compliance=not+complied&submit=true&view=&page=0" target="_blank" rel="noopener noreferrer">view ${forename}’s failures to comply (opens in new tab)</a>
            </li>
            <li>
              <a class="govuk-link" href="/case/${crn}/compliance" target="_blank" rel="noopener noreferrer">view ${forename}’s previous breach information (opens in new tab)</a>
            </li>
          </ul>',
          `,
          type: 'RED',
        }
      }
    }

    // acceptable absence page 👈

    if (reqUrl.endsWith('acceptable-absence') && acceptableAbsence?.length > 1) {
      ticket = {
        title: `${forename} has had multiple acceptable absences in the past 12 months`,
        html: `<p class="govuk-body">You can view a <a class="govuk-link" href="/case/${crn}/activitylog/redirect?keywords=&compliance=complied&submit=true&view=&page=0" target="_blank" rel="noopener noreferrer">list of ${forename}'s acceptable absences (opens in new tab)</a>.`,
        type: 'BLUE',
      }
    }

    res.locals.appointmentOutcome.ticket = ticket
    return next()
  }
}
