import ActivityLogPage from '../../pages/activityLog'
import AppointmentPage from '../../pages/appointment'

const loadPage = () => {}

describe('View appointment note page', () => {
  it('Appointment note page is rendered', () => {
    cy.visit('/case/X000001/appointments/appointment/11/manage/note/1')
    const page = new AppointmentPage()
    page.appointmentType().should('contain.text', 'Communication')
    page.appointmentTitle().should('contain.text', 'Phone call with Terry Jones')
    page.getCardHeader('appointmentDetails').should('contain.text', 'Details')
    page.getRowData('appointmentDetails', 'type', 'Value').should('contain.text', 'Phone call')
    page.getRowData('appointmentDetails', 'date', 'Value').should('contain.text', 'Thursday 22 December')
    page.getRowData('appointmentDetails', 'time', 'Value').should('contain.text', '9:15am to 9:30am')
    page.getRowData('appointmentDetails', 'rar', 'Value').should('contain.text', 'Stepping Stones')
    page.getRowData('appointmentDetails', 'rarActivity', 'Value').should('contain.text', 'Not provided')
    page.getRowData('appointmentDetails', 'noteAddedBy', 'Value').should('contain.text', 'Tom Brady')
    page.getRowData('appointmentDetails', 'dateAdded', 'Value').should('contain.text', '29 October 2024')
    page.getRowData('appointmentDetails', 'note', 'Value').should('contain.text', 'Email sent to Stuart')
    page.getRowData('appointmentDetails', 'sensitive', 'Label').should('contain.text', 'No')
  })
  it('Back link goes to contacts by default', () => {
    cy.visit('/case/X000001/appointments/appointment/11/manage/note/1')
    const page = new AppointmentPage()
    page.getBackLink().click()
    const activityLogPage = new ActivityLogPage()
    activityLogPage.checkOnPage()
  })
  it('Back link goes to source page', () => {
    cy.visit('/case/X000001/activity-log')
    const activityLogPage = new ActivityLogPage()
    activityLogPage.getTimelineCard(2).find('.app-note').find('a').click()
    const page = new AppointmentPage()
    page.getBackLink().click()
    activityLogPage.checkOnPage()
  })
  it('Back links function with nested backLinks', () => {
    cy.visit('/case/X000001/activity-log')
    const activityLogPage = new ActivityLogPage()
    activityLogPage.getTimelineCard(2).find('.app-summary-card__title').find('a').click()
    const appointmentPage = new AppointmentPage()
    appointmentPage.getRowData('appointmentDetails', 'notes', 'Value').find('.app-note').eq(1).find('a').click()
    const page = new AppointmentPage()
    page.getBackLink().click()
    appointmentPage.getBackLink().click()
    activityLogPage.checkOnPage()
  })
})
