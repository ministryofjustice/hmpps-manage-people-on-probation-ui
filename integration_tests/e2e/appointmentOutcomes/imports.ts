import { DateTime } from 'luxon'
import AcceptableAbsencePage from '../../pages/appointmentOutcomes/acceptable-absence.page'
import AttendedFailedToComplyPage from '../../pages/appointmentOutcomes/attended-failed-to-comply.page'
import FailedToAttendPage from '../../pages/appointmentOutcomes/failed-to-attend.page'
import UnacceptableAbsencePage from '../../pages/appointmentOutcomes/unacceptable-absence.page'
import Page from '../../pages/page'

export interface ExpectedOption<TPage extends Page> {
  value: string
  text: string
  hint?: string
  RedirectPage?: Constructor<TPage>
  redirectPageName?: string
  redirectPageTitle?: string
}

export type Journey = 'MANAGE' | 'RESCHEDULE' | 'ARRANGE'

type Constructor<T = any> = new (...args: any[]) => T

export const checkOptions = <TPage extends Page>(options: ExpectedOption<TPage>[], radioGroupIndex = 0): void => {
  options.forEach(({ value, text, hint }, index) => {
    cy.get('[data-module="govuk-radios"]')
      .eq(radioGroupIndex)
      .find('.govuk-radios__item')
      .eq(index)
      .find('label')
      .should('contain.text', text)
    if (hint) {
      cy.get('[data-module="govuk-radios"]')
        .eq(radioGroupIndex)
        .find('.govuk-radios__item')
        .eq(index)
        .find('.govuk-hint')
        .should('contain.text', hint)
    }
    cy.get('[data-module="govuk-radios"]')
      .eq(radioGroupIndex)
      .find(`.govuk-radios__input[value=${value}]`)
      .should('exist')
  })
}

export const checkOptionRedirectsToCorrectPage = <TPage extends Page, TArgs extends Record<string, any>>(
  options: ExpectedOption<TPage>[],
  loadPageFunc: (args: any) => void,
  args: TArgs = {} as TArgs,
): void => {
  options.forEach(({ value, RedirectPage, redirectPageTitle }) => {
    loadPageFunc(args)
    const outcomePage = new args.Page()
    cy.get(`.govuk-radios__input[value=${value}]`).click()
    outcomePage.getSubmitBtn().click()
    const page = new RedirectPage()
    page.checkPageTitle(redirectPageTitle)
  })
}

export const checkBreachOrRecallWarningBanner = <TArgs extends Record<string, any>>(
  loadPageFunc: (args: any) => void,
  args: TArgs = {} as TArgs,
): void => {
  describe('Breach warning banner', () => {
    it('should show when sentence type is COMMUNITY and there is an active breach', () => {
      cy.task('stubCompliance')
      loadPageFunc(args)
      const page = new args.Page()
      page.getBreachOrRecallWarning().find('h2').should('contain.text', 'There is a live breach for this sentence')
      page
        .getBreachOrRecallWarning()
        .find('span')
        .should('contain.text', 'The breach for 12 month community order was initiated on 15 January 2024.')
    })
    it('should not show when sentence type is COMMUNITY and there is no active breach', () => {
      cy.task('stubAppointment', { eventId: '2501192724', type: 'COMMUNITY' })
      cy.task('stubCompliance', { activeBreach: false })
      loadPageFunc(args)
      const page = new args.Page()
      page.getBreachOrRecallWarning().should('not.exist')
    })
  })

  describe('Recall warning banner', () => {
    beforeEach(() => {
      cy.task('resetMocks')
    })
    it('should show when sentence type is CUSTODY and there is an active recall', () => {
      cy.task('stubCompliance', { activeBreach: false, activeRecall: true })
      cy.task('stubSentences', { sentenceType: 'CUSTODY' })
      loadPageFunc({ ...args, sentenceType: 'CUSTODY' })
      const page = new args.Page()
      page
        .getBreachOrRecallWarning({ type: 'recall' })
        .find('h2')
        .should('contain.text', 'There is a live recall for this sentence')
      page
        .getBreachOrRecallWarning({ type: 'recall' })
        .find('span')
        .should('contain.text', 'The recall for 12 month community order was initiated on 15 January 2024.')
    })
    it('should not show when sentence type is CUSTODY and there is no active recall', () => {
      cy.task('stubAppointment', { eventId: '2501192724', type: 'COMMUNITY' })
      cy.task('stubCompliance', { activeBreach: false, activeRecall: false })
      loadPageFunc(args)
      const page = new args.Page()
      page.getBreachOrRecallWarning({ type: 'recall' }).should('not.exist')
    })
  })
}

export const checkTicketPanel = <TArgs extends Record<string, any>>(
  loadPageFunc: (args: any) => void,
  PageClass:
    | typeof AttendedFailedToComplyPage
    | typeof UnacceptableAbsencePage
    | typeof FailedToAttendPage
    | typeof AcceptableAbsencePage,
  args?: TArgs,
) => {
  describe('Ticket panel', () => {
    beforeEach(() => {
      cy.task('resetMocks')
    })
    const page = new PageClass()
    if (page instanceof AttendedFailedToComplyPage || page instanceof UnacceptableAbsencePage) {
      it('should not display the ticket panel if no FTC counts', () => {
        cy.task('stubPersonNonComplianceDetail', { unacceptableAbsenceCount: 0 })
        cy.task('stubCompliance', { priorBreachesOnCurrentOrderCount: 0 })
        loadPageFunc({ ...args })
        page.getTicketPanel().should('not.exist')
      })
      it('should display the ticket panel if one previous FTC and no previous breach', () => {
        cy.task('stubPersonNonComplianceDetail')
        cy.task('stubCompliance', { priorBreachesOnCurrentOrderCount: 0 })
        loadPageFunc({ ...args })
        page
          .getTicketPanel()
          .should('contain.text', 'This is Alton’s second count of non-compliance in the past 12 months')
      })
      it('should display the ticket panel if more than one previous FTC and no previous breach', () => {
        cy.task('stubPersonNonComplianceDetail', { unacceptableAbsenceCount: 1, attendedButDidNotComplyCount: 1 })
        cy.task('stubCompliance', { priorBreachesOnCurrentOrderCount: 0 })
        loadPageFunc({ ...args })
        page
          .getTicketPanel()
          .should('contain.text', 'Alton has had multiple counts of non-compliance in the past 12 months.')
          .should('contain.text', 'You should consider initiating a breach')
      })
      it('should display the ticket panel if more than one previous FTC and previous breach', () => {
        cy.task('stubPersonNonComplianceDetail', { unacceptableAbsenceCount: 1, attendedButDidNotComplyCount: 1 })
        cy.task('stubCompliance')
        loadPageFunc({ ...args })

        page
          .getTicketPanel()
          .should('contain.text', 'Alton has had multiple counts of non-compliance in the past 12 months.')
          .should('contain.text', 'Alton has breached this sentence before')
      })
    }
    if (page instanceof AcceptableAbsencePage) {
      it('should not display the ticket panel if no acceptable absence counts', () => {
        cy.task('stubPersonNonComplianceDetail')
        cy.task('stubCompliance')
        loadPageFunc({ ...args })
        page.getTicketPanel().should('not.exist')
      })
      it('should display the ticket panel if more than on acceptable absence count', () => {
        cy.task('stubPersonNonComplianceDetail', { acceptableAbsenceCount: 2 })
        cy.task('stubCompliance')
        loadPageFunc({ ...args })
        page.getTicketPanel().should('contain.text', 'Alton has had multiple acceptable absences in the past 12 months')
      })
    }
    if (page instanceof FailedToAttendPage) {
      it('should not display the ticket panel if no acceptable absence counts', () => {
        cy.task('stubContactOutcomes', { matchedResponsePeriodDays: false })
        loadPageFunc({ ...args })
        page.getTicketPanel().should('not.exist')
      })
      it('should display the ticket panel if more than one previous FTC and previous breach', () => {
        const startDateTime = DateTime.now().minus({ days: 2 })
        const startDateTimeISO = startDateTime.toISO()
        const expectedDate = DateTime.now().plus({ days: 5 }).toFormat('d MMMM yyyy')
        cy.task('stubContactOutcomes')
        loadPageFunc({ ...args, startDateTime: startDateTimeISO })
        page
          .getTicketPanel()
          .should('contain.text', `Alton has until ${expectedDate} to submit evidence (5 days remaining)`)
      })
    }
  })
}
