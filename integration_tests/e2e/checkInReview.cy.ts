import Page from '../pages/page'
import AppointmentsPage from '../pages/appointments'
import ViewCheckInPage from '../pages/check-ins/view.page'
import ActivityLogPage from '../pages/activityLog'
import CheckInReviewExpiredPage from '../pages/check-ins/review/expired.page'
import CheckInReviewIdentityPage from '../pages/check-ins/review/identity.page'
import CheckInReviewNotesPage from '../pages/check-ins/review/notes.page'
import ViewExpiredCheckInPage from '../pages/check-ins/view-expired.page'

const crn = 'X000001'
const expiredId = '5fa85f64-5717-4562-b3fc-2c963f66afa6'
const expiredSubmittedId = '7fa85f64-5717-4562-b3fc-2c963f66afa6'
const submittedId = '6fa85f64-5717-4562-b3fc-2c963f66afa6'
const reviewedId = '3fa85f64-5717-4562-b3fc-2c963f66afa6'
const livenessPassId = '8fa85f64-5717-4562-b3fc-2c963f66afa6'
const livenessFallbackId = '9fa85f64-5717-4562-b3fc-2c963f66afa6'
const livenessNoMatchId = 'afa85f64-5717-4562-b3fc-2c963f66afa6'
const reviewedLivenessId = 'bfa85f64-5717-4562-b3fc-2c963f66afa6'

context('check in reviews', () => {
  it('Check in page for reviewed check in', () => {
    cy.visit(`/case/${crn}/appointments/${reviewedId}/check-in/update`)
    const page = Page.verifyOnPage(ViewCheckInPage)

    page
      .getSummaryListRow(1, 'reviewSummary')
      .find('.govuk-summary-list__key')
      .should('contain.text', 'Is the person in the image from the check in John?')
    page.getSummaryListRow(1, 'reviewSummary').find('.govuk-summary-list__value').should('contain.text', 'Yes')
    page
      .getSummaryListRow(1, 'reviewSummary')
      .find('.govuk-summary-list__actions .govuk-tag')
      .should('contain.text', 'Identity confirmed')

    page.getBackLink().click()
    Page.verifyOnPage(ActivityLogPage)
  })

  it('Review page for expired check in', () => {
    cy.visit(`/case/${crn}/appointments/${expiredId}/check-in/update`)
    const page = Page.verifyOnPage(CheckInReviewExpiredPage)

    page.getBackLink().click()
    Page.verifyOnPage(ActivityLogPage)
  })

  it('Completes an expired check in review and marks it as sensitive', () => {
    cy.visit(`/case/${crn}/appointments/${expiredId}/check-in/update`)
    const page = Page.verifyOnPage(CheckInReviewExpiredPage)
    page.checkinNotes().type('They lost their phone.')
    page.sensitiveContactGroup().should('exist')
    page.radioSensitiveYes().click({ force: true })
    page.completeReviewButton().click()
    Page.verifyOnPage(ActivityLogPage)
  })

  it('View page for expired check in that has been reviewed', () => {
    cy.visit(`/case/${crn}/appointments/${expiredSubmittedId}/check-in/update`)
    const page = Page.verifyOnPage(ViewExpiredCheckInPage)

    page.getBackLink().click()
    Page.verifyOnPage(ActivityLogPage)
  })

  it('Review pages for submitted check in', () => {
    cy.visit(`/case/${crn}/appointments/${submittedId}/check-in/update`)
    const page = Page.verifyOnPage(CheckInReviewIdentityPage)

    page.getRadio('confirmIdentity', 1).click()
    page.getSubmitBtn().click()
    const page2 = Page.verifyOnPage(CheckInReviewNotesPage)

    page2.getBackLink().click()
    page.checkOnPage()
    page.getSubmitBtn().click()
    page2.checkOnPage()
  })

  it('Completes a submitted check in review and marks it as NOT sensitive', () => {
    cy.visit(`/case/${crn}/appointments/${submittedId}/check-in/update`)
    const identityPage = Page.verifyOnPage(CheckInReviewIdentityPage)
    identityPage.getRadio('confirmIdentity', 1).click()
    identityPage.getSubmitBtn().click()
    const notesPage = Page.verifyOnPage(CheckInReviewNotesPage)
    notesPage.sensitiveContactGroup().should('exist')
    notesPage.radioSensitiveNo().click({ force: true })
    notesPage.completeReviewButton().click()
    Page.verifyOnPage(ActivityLogPage)
  })

  it('Adds an update to a reviewed check in', () => {
    cy.visit(`/case/${crn}/appointments/${reviewedId}/check-in/update`)
    const viewPage = Page.verifyOnPage(ViewCheckInPage)
    viewPage.sensitiveContactGroup().should('exist')
    viewPage.radioSensitiveYes().click({ force: true })
    viewPage.checkinNotes().type('This contains sensitive information.')
    viewPage.completeReviewButton().click()
  })

  it('Adds an update to an expired check in', () => {
    cy.visit(`/case/${crn}/appointments/${expiredSubmittedId}/check-in/update`)
    const viewExpiredPage = Page.verifyOnPage(ViewExpiredCheckInPage)
    viewExpiredPage.sensitiveContactGroup().should('exist')
    viewExpiredPage.checkinNotes().type('They were in hospital. Now marking this contact as sensitive.')
    viewExpiredPage.radioSensitiveYes().click({ force: true })
    viewExpiredPage.completeReviewButton().click()
  })

  it('System ID check shows Pass when liveness enabled with LIVE result and face MATCH', () => {
    cy.visit(`/case/${crn}/appointments/${livenessPassId}/check-in/update`)
    const page = Page.verifyOnPage(CheckInReviewIdentityPage)

    page
      .getSummaryListRow(1, 'identitySummary')
      .find('.govuk-summary-list__key')
      .should('contain.text', 'System ID and liveness check result')
    page.getSummaryListRow(1, 'identitySummary').find('.govuk-summary-list__value').should('contain.text', 'Pass')
    page.getSummaryListRow(1, 'identitySummary').find('.govuk-tag--red').should('not.exist')
  })

  it('System ID check shows Fail when liveness enabled but user fell back to video', () => {
    cy.visit(`/case/${crn}/appointments/${livenessFallbackId}/check-in/update`)
    const page = Page.verifyOnPage(CheckInReviewIdentityPage)

    page.getSummaryListRow(1, 'identitySummary').find('.govuk-summary-list__value').should('contain.text', 'Fail')
    page.getSummaryListRow(1, 'identitySummary').find('.govuk-tag--red').should('contain.text', 'Needs attention')
  })

  it('System ID check shows Fail when liveness enabled with LIVE result but face NO_MATCH', () => {
    cy.visit(`/case/${crn}/appointments/${livenessNoMatchId}/check-in/update`)
    const page = Page.verifyOnPage(CheckInReviewIdentityPage)

    page.getSummaryListRow(1, 'identitySummary').find('.govuk-summary-list__value').should('contain.text', 'Fail')
    page.getSummaryListRow(1, 'identitySummary').find('.govuk-tag--red').should('contain.text', 'Needs attention')
  })

  it('System ID check shows Pass when liveness not enabled and face MATCH', () => {
    cy.visit(`/case/${crn}/appointments/${submittedId}/check-in/update`)
    const page = Page.verifyOnPage(CheckInReviewIdentityPage)

    page
      .getSummaryListRow(1, 'identitySummary')
      .find('.govuk-summary-list__key')
      .should('contain.text', 'System ID check result')
      .should('not.contain.text', 'liveness')
    page.getSummaryListRow(1, 'identitySummary').find('.govuk-summary-list__value').should('contain.text', 'Pass')
    page.getSummaryListRow(1, 'identitySummary').find('.govuk-tag--red').should('not.exist')
  })

  it('Reviewed check-in view page shows Pass when liveness enabled with LIVE result and face MATCH', () => {
    cy.visit(`/case/${crn}/appointments/${reviewedLivenessId}/check-in/update`)
    const page = Page.verifyOnPage(ViewCheckInPage)

    page
      .getSummaryListRow(1, 'checkInSummary')
      .find('.govuk-summary-list__key')
      .should('contain.text', 'System ID and liveness check result')
    page.getSummaryListRow(1, 'checkInSummary').find('.govuk-summary-list__value').should('contain.text', 'Pass')
  })
})
