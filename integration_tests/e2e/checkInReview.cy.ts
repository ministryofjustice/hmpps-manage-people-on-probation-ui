import Page from '../pages/page'
import AppointmentsPage from '../pages/appointments'
import ViewCheckInPage from '../pages/check-ins/view.page'
import ActivityLogPage from '../pages/activityLog'
import CheckInReviewExpiredPage from '../pages/check-ins/review/expired.page'
import CheckInReviewIdentityPage from '../pages/check-ins/review/identity.page'
import CheckInReviewNotesPage from '../pages/check-ins/review/notes.page'
import CheckInVideoPage from '../pages/check-ins/video.page'

const crn = 'X000001'
const expiredId = '5fa85f64-5717-4562-b3fc-2c963f66afa6'
const submittedId = '6fa85f64-5717-4562-b3fc-2c963f66afa6'
const reviewedId = '3fa85f64-5717-4562-b3fc-2c963f66afa6'

context('check in reviews', () => {
  it('Check in page for reviewed check in', () => {
    cy.visit(`/case/${crn}/appointments/${reviewedId}/check-in/update`)
    const page = Page.verifyOnPage(ViewCheckInPage)

    page
      .getSummaryListRow(1, 'reviewSummary')
      .find('.govuk-summary-list__key')
      .should('contain.text', 'Is this person in the video John?')
    page.getSummaryListRow(1, 'reviewSummary').find('.govuk-summary-list__value').should('contain.text', 'Yes')
    page
      .getSummaryListRow(1, 'reviewSummary')
      .find('.govuk-summary-list__actions .govuk-tag')
      .should('contain.text', 'Identity confirmed')

    page
      .getSummaryListRow(4, 'checkInSummary')
      .find('.govuk-summary-list__key')
      .should('contain.text', 'Check in video')
    page
      .getSummaryListRow(4, 'checkInSummary')
      .find('.govuk-summary-list__value .govuk-link')
      .should(
        'have.attr',
        'href',
        `/case/${crn}/appointments/${reviewedId}/check-in/video?back=${encodeURIComponent(`/case/${crn}/appointments/${reviewedId}/check-in/view`)}`,
      )
    page.getBackLink().click()
    Page.verifyOnPage(ActivityLogPage)
  })

  it('Review page for expired check in', () => {
    cy.visit(`/case/${crn}/appointments/${expiredId}/check-in/update`)
    const page = Page.verifyOnPage(CheckInReviewExpiredPage)

    page.getBackLink().click()
    Page.verifyOnPage(ActivityLogPage)
  })

  it('Review pages for submitted check in', () => {
    cy.visit(`/case/${crn}/appointments/${submittedId}/check-in/update`)
    const page = Page.verifyOnPage(CheckInReviewIdentityPage)

    page
      .getSummaryListRow(4, 'identitySummary')
      .find('.govuk-summary-list__key')
      .should('contain.text', 'Check in video')
    page
      .getSummaryListRow(4, 'identitySummary')
      .find('.govuk-summary-list__value .govuk-link')
      .should(
        'have.attr',
        'href',
        `/case/${crn}/appointments/${submittedId}/check-in/video?back=${encodeURIComponent(`/case/${crn}/appointments/${submittedId}/check-in/review/identity`)}`,
      )

    page.getRadio('confirmIdentity', 1).click()
    page.getSubmitBtn().click()
    const page2 = Page.verifyOnPage(CheckInReviewNotesPage)

    page2.getBackLink().click()
    page.checkOnPage()
    page.getSubmitBtn().click()
    page2.checkOnPage()
  })

  it('Review video for check in', () => {
    cy.visit(`/case/${crn}/appointments/${reviewedId}/check-in/video`)
    const page = Page.verifyOnPage(CheckInVideoPage)

    page.getSubmitBtn().click()
    const page2 = Page.verifyOnPage(ViewCheckInPage)

    page2.getSummaryListRow(4, 'checkInSummary').find('.govuk-summary-list__value .govuk-link').click()
    page.checkOnPage()
  })
})
