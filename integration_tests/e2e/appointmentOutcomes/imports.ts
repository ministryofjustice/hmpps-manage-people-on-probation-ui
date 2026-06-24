import { DateTime } from 'luxon'
import AcceptableAbsencePage from '../../pages/appointmentOutcomes/acceptable-absence.page'
import AttendedFailedToComplyPage from '../../pages/appointmentOutcomes/attended-failed-to-comply.page'
import FailedToAttendPage from '../../pages/appointmentOutcomes/failed-to-attend.page'
import UnacceptableAbsencePage from '../../pages/appointmentOutcomes/unacceptable-absence.page'
import Page from '../../pages/page'
import EnforcementActionPage from '../../pages/appointmentOutcomes/enforcement-action.page'
import InitiateBreachOrRecallPage from '../../pages/appointmentOutcomes/initiate-breach-or-recall.page'
import SendLetterPage from '../../pages/appointmentOutcomes/send-letter.page'
import OutcomePage from '../../pages/appointmentOutcomes/outcome.page'
import UpdateEnforcementActionPage from '../../pages/appointmentOutcomes/update-enforcement-action.page'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import ActivityLogPage from '../../pages/activityLog'
import CompliancePage from '../../pages/compliance'

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

type RedirectPage =
  | typeof AcceptableAbsencePage
  | typeof AttendedFailedToComplyPage
  | typeof FailedToAttendPage
  | typeof OutcomePage
  | typeof UnacceptableAbsencePage
  | typeof UpdateEnforcementActionPage

export const checkOptionRedirectsToCorrectPage = <TPage extends Page, TArgs extends Record<string, any>>(
  options: ExpectedOption<TPage>[],
  loadPageFunc: (args: any) => void,
  PageClass: RedirectPage,
  args: TArgs,
): void => {
  options.forEach(({ value, RedirectPage, redirectPageTitle }) => {
    loadPageFunc(args)
    const outcomePage = new PageClass()
    cy.get(`.govuk-radios__input[value=${value}]`).click()
    outcomePage.getSubmitBtn().click()
    const page = new RedirectPage()
    page.checkPageTitle(redirectPageTitle)
  })
}

// instead of loading page each time this method:
// - accepts option
// - submits to redirect
// - check new page
// - uses backLink to return to options
export const checkOptionRedirects = <TPage extends Page>(
  options: ExpectedOption<TPage>[],
  PageClass: RedirectPage,
): void => {
  options.forEach(({ value, RedirectPage, redirectPageTitle }) => {
    const outcomePage = new PageClass()
    cy.get(`.govuk-radios__input[value=${value}]`).click()
    outcomePage.getSubmitBtn().click()
    const page = new RedirectPage()
    page.checkPageTitle(redirectPageTitle)
    cy.go('back')
    cy.get('[data-module="govuk-radios"]').should('exist')
  })
}

type WarningBannerPage =
  | typeof OutcomePage
  | typeof AttendedFailedToComplyPage
  | typeof AcceptableAbsencePage
  | typeof UnacceptableAbsencePage
  | typeof FailedToAttendPage
  | typeof EnforcementActionPage
  | typeof InitiateBreachOrRecallPage
  | typeof SendLetterPage

export const checkBreachOrRecallWarningBanner = <TArgs extends Record<string, any>>(
  loadPageFunc: (args: any) => void,
  PageClass: WarningBannerPage,
  args: TArgs = {} as TArgs,
): void => {
  describe('Breach warning banner', () => {
    it('should show when sentence type is COMMUNITY and there is an active breach', () => {
      cy.task('stubCompliance')
      loadPageFunc(args)
      cy.task('log', 'Page loaded')
      const page = new PageClass()
      page.getBreachOrRecallWarning().find('h2').should('contain.text', 'There is a live breach for this sentence')
      page
        .getBreachOrRecallWarning()
        .find('span')
        .should('contain.text', 'The breach for 12 month community order was initiated on 15 January 2024.')
      cy.task('log', 'Banner checked')
    })
    it('should not show when sentence type is COMMUNITY and there is no active breach', () => {
      cy.task('stubAppointment', { eventId: '2501192724', type: 'COMMUNITY' })
      cy.task('stubCompliance', { activeBreach: false })
      loadPageFunc(args)
      const page = new PageClass()
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
      const page = new PageClass()
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
      const page = new PageClass()
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
    afterEach(() => {
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
      it('should display the ticket panel if sentence type is COMMUNITY, has one previous FTC and no previous breach', () => {
        cy.task('stubPersonNonComplianceDetail')
        cy.task('stubCompliance', { priorBreachesOnCurrentOrderCount: 0, priorRecallsOnCurrentOrderCount: 0 })
        loadPageFunc({ ...args })
        page
          .getTicketPanel()
          .should('contain.text', 'This is Alton’s second count of non-compliance in the past 12 months')
          .should('contain.text', 'You should consider initiating a breach')
        page
          .getTicketPanel()
          .find('.govuk-link')
          .eq(0)
          .should('contain.text', '18 January 2026: 12 month Community order (opens in new tab)')
          .should('have.attr', 'target', '_blank')
          .invoke('removeAttr', 'target')
          .click()
        const managePage = new ManageAppointmentPage()
        managePage.checkPageTitle('Manage 3 way meeting (NS) with Terry Jones')
      })
      it('should display the ticket panel if sentence type is CUSTODY, has one previous FTC and no previous recall', () => {
        cy.task('stubPersonNonComplianceDetail')
        cy.task('stubCompliance', { priorBreachesOnCurrentOrderCount: 0, priorRecallsOnCurrentOrderCount: 0 })
        loadPageFunc({ ...args, sentenceType: 'CUSTODY' })
        page
          .getTicketPanel()
          .should('contain.text', 'This is Alton’s second count of non-compliance in the past 12 months')
          .should('contain.text', 'You should consider initiating a recall')
        page
          .getTicketPanel()
          .find('.govuk-link')
          .eq(0)
          .should('contain.text', '18 January 2026: 12 month Community order (opens in new tab)')
          .should('have.attr', 'target', '_blank')
          .invoke('removeAttr', 'target')
          .click()
        const managePage = new ManageAppointmentPage()
        managePage.checkPageTitle('Manage 3 way meeting (NS) with Terry Jones')
      })
      it('should display the ticket panel if sentence type is COMMUNITY, has more than one previous FTC and no previous breach', () => {
        cy.task('stubPersonNonComplianceDetail', { unacceptableAbsenceCount: 1, attendedButDidNotComplyCount: 1 })
        cy.task('stubCompliance', { priorBreachesOnCurrentOrderCount: 0, priorRecallsOnCurrentOrderCount: 0 })
        loadPageFunc({ ...args })
        page
          .getTicketPanel()
          .should('contain.text', 'Alton has had multiple counts of non-compliance in the past 12 months')
          .should('contain.text', 'You should consider initiating a breach')
        page
          .getTicketPanel()
          .find('.govuk-link')
          .eq(0)
          .should('contain.text', 'View a list of Alton’s non-compliance (opens in new tab)')
          .should('have.attr', 'target', '_blank')
          .invoke('removeAttr', 'target')
          .click()
        const contactsPage = new ActivityLogPage()
        contactsPage.getSelectedFilterTags().eq(0).should('contain.text', 'Not complied')
        contactsPage.getComplianceFilter(3).should('be.checked')
      })
      it('should display the ticket panel if sentence type is CUSTODY, has more than one previous FTC and no previous recall', () => {
        cy.task('stubPersonNonComplianceDetail', { unacceptableAbsenceCount: 1, attendedButDidNotComplyCount: 1 })
        cy.task('stubCompliance', { priorBreachesOnCurrentOrderCount: 0, priorRecallsOnCurrentOrderCount: 0 })
        loadPageFunc({ ...args, sentenceType: 'CUSTODY' })
        page
          .getTicketPanel()
          .should('contain.text', 'Alton has had multiple counts of non-compliance in the past 12 months')
          .should('contain.text', 'You should consider initiating a recall.')
        page
          .getTicketPanel()
          .find('.govuk-link')
          .eq(0)
          .should('contain.text', 'View a list of Alton’s non-compliance (opens in new tab)')
          .should('have.attr', 'target', '_blank')
          .invoke('removeAttr', 'target')
          .click()
        const contactsPage = new ActivityLogPage()
        contactsPage.getSelectedFilterTags().eq(0).should('contain.text', 'Not complied')
        contactsPage.getComplianceFilter(3).should('be.checked')
      })
      it('should display the ticket panel if sentence type is COMMUNITY, has more than one previous FTC and previous breach', () => {
        cy.task('stubPersonNonComplianceDetail', { unacceptableAbsenceCount: 1, attendedButDidNotComplyCount: 1 })
        cy.task('stubCompliance', { priorBreachesOnCurrentOrderCount: 1, priorRecallsOnCurrentOrderCount: 0 })
        loadPageFunc({ ...args })
        page
          .getTicketPanel()
          .should('contain.text', 'Alton has had multiple counts of non-compliance in the past 12 months')
          .should('contain.text', 'Alton has breached this sentence before')
        page
          .getTicketPanel()
          .find('.govuk-link')
          .eq(0)
          .should('contain.text', 'view Alton’s failures to comply (opens in new tab)')
          .should('have.attr', 'target', '_blank')
          .invoke('removeAttr', 'target')
          .click()
        const contactsPage = new ActivityLogPage()
        contactsPage.getSelectedFilterTags().eq(0).should('contain.text', 'Not complied')
        contactsPage.getComplianceFilter(3).should('be.checked')
        loadPageFunc({ ...args })
        page
          .getTicketPanel()
          .find('.govuk-link')
          .eq(1)
          .should('contain.text', 'view Alton’s previous breach information (opens in new tab)')
          .should('have.attr', 'target', '_blank')
          .invoke('removeAttr', 'target')
          .click()
        const compliancePage = new CompliancePage()
        compliancePage.checkPageTitle('Compliance')
      })
      it('should display the ticket panel if sentence type is CUSTODY, has more than one previous FTC and previous recall', () => {
        cy.task('stubPersonNonComplianceDetail', { unacceptableAbsenceCount: 1, attendedButDidNotComplyCount: 1 })
        cy.task('stubCompliance', { priorBreachesOnCurrentOrderCount: 0, priorRecallsOnCurrentOrderCount: 1 })
        loadPageFunc({ ...args, sentenceType: 'CUSTODY' })
        page
          .getTicketPanel()
          .should('contain.text', 'Alton has had multiple counts of non-compliance in the past 12 months')
          .should('contain.text', 'Alton has been recalled before')
        page
          .getTicketPanel()
          .find('.govuk-link')
          .eq(0)
          .should('contain.text', 'view Alton’s failures to comply (opens in new tab)')
          .should('have.attr', 'target', '_blank')
          .invoke('removeAttr', 'target')
          .click()
        const contactsPage = new ActivityLogPage()
        contactsPage.getSelectedFilterTags().eq(0).should('contain.text', 'Not complied')
        contactsPage.getComplianceFilter(3).should('be.checked')
        loadPageFunc({ ...args })
        page
          .getTicketPanel()
          .find('.govuk-link')
          .eq(1)
          .should('contain.text', 'view Alton’s previous breach information (opens in new tab)')
          .should('have.attr', 'target', '_blank')
          .invoke('removeAttr', 'target')
          .click()
        const compliancePage = new CompliancePage()
        compliancePage.checkPageTitle('Compliance')
      })
    }
    if (page instanceof AcceptableAbsencePage) {
      it('should not display the ticket panel if no acceptable absence counts', () => {
        cy.task('stubPersonNonComplianceDetail')
        cy.task('stubCompliance')
        loadPageFunc({ ...args })
        page.getTicketPanel().should('not.exist')
      })
      it('should display the ticket panel if more than one acceptable absence count', () => {
        cy.task('stubPersonNonComplianceDetail', { acceptableAbsenceCount: 2 })
        cy.task('stubCompliance')
        loadPageFunc({ ...args })
        page.getTicketPanel().should('contain.text', 'Alton has had multiple acceptable absences in the past 12 months')
        page
          .getTicketPanel()
          .find('.govuk-link')
          .eq(0)
          .should('contain.text', 'list of Alton’s acceptable absences (opens in new tab)')
          .should('have.attr', 'target', '_blank')
          .invoke('removeAttr', 'target')
          .click()
        const contactsPage = new ActivityLogPage()
        contactsPage.getSelectedFilterTags().eq(0).should('contain.text', 'acceptable absence')
        contactsPage.getSelectedFilterTags().eq(1).should('contain.text', 'Complied')
        contactsPage.getComplianceFilter(2).should('be.checked')
        contactsPage.getKeywordsInput().should('have.value', 'acceptable absence')
      })
    }
    if (page instanceof FailedToAttendPage) {
      it('should not display the ticket panel action option response period days values do not all match', () => {
        cy.task('stubContactOutcomes', { matchedResponsePeriodDays: false })
        loadPageFunc({ ...args })
        page.getTicketPanel().should('not.exist')
      })
      it('should not display the ticket panel if evidence response by date is in the past', () => {
        const startDateTime = DateTime.now().minus({ days: 10 })
        const startDateTimeISO = startDateTime.toISO()
        cy.task('stubContactOutcomes')
        loadPageFunc({ ...args, startDateTime: startDateTimeISO })
        page.getTicketPanel().should('not.exist')
      })
      it('should display the ticket panel if all action option response period days values match and response by date is in the future or today', () => {
        const startDateTime = DateTime.now().minus({ days: 2 })
        const startDateTimeISO = startDateTime.toISO()
        const expectedDate = DateTime.now().plus({ days: 5 }).toFormat('d MMMM yyyy')
        cy.task('stubContactOutcomes')
        loadPageFunc({ ...args, startDateTime: startDateTimeISO })
        page
          .getTicketPanel()
          .should('contain.text', `Alton has until ${expectedDate} to submit evidence (6 days remaining)`)
      })
    }
  })
}
