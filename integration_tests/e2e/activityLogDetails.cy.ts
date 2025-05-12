import ActivityLogDetailsPage from '../pages/activityLogDetails'

context('Activity log details', () => {
  it('should render a complied appointment', () => {
    cy.visit('/case/X000001/activity-log/activity/15')
    const page = new ActivityLogDetailsPage()
    page.setPageTitle('Office appointment with Terry Jones')
    cy.get('[data-qa="appointmentType"]').should('contain.text', 'National standard appointment')
    cy.get('[data-qa="complianceTag"]').should('contain.text', 'Complied')
    page.getCardHeader('appointmentDetails').should('contain.text', 'Appointment details')
    page
      .getCardElement('appointmentDetails', '.govuk-summary-list__key', 0)
      .should('contain.text', 'Type of appointment')
    page
      .getCardElement('appointmentDetails', '.govuk-summary-list__value', 0)
      .should('contain.text', 'Office appointment')
    page.getCardElement('appointmentDetails', '.govuk-summary-list__key', 1).should('contain.text', 'Description')
    page
      .getCardElement('appointmentDetails', '.govuk-summary-list__value', 1)
      .should('contain.text', 'User-generated free text content')
    page.getCardElement('appointmentDetails', '.govuk-summary-list__key', 2).should('contain.text', 'Date')
    page.getCardElement('appointmentDetails', '.govuk-summary-list__value', 2).should('contain.text', 'Friday 22 March')
    page.getCardElement('appointmentDetails', '.govuk-summary-list__key', 3).should('contain.text', 'Time')
    page
      .getCardElement('appointmentDetails', '.govuk-summary-list__value', 3)
      .should('contain.text', '10:15am to 10:30am')

    page.getCardHeader('outcomeDetails').should('contain.text', 'Outcome details')
    page.getCardElement('outcomeDetails', '.govuk-summary-list__key', 0).should('contain.text', 'Complied')
    page.getCardElement('outcomeDetails', '.govuk-summary-list__value', 0).should('contain.text', 'Yes')
    page.getCardElement('outcomeDetails', '.govuk-summary-list__actions a', 0).should('contain.text', 'Change')
    page
      .getCardElement('outcomeDetails', '.govuk-summary-list__actions', 0)
      .find('a')
      .should(
        'have.attr',
        'href',
        'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=UpdateContact&CRN=X000001&contactID=15',
      )
    page.getCardElement('outcomeDetails', '.govuk-summary-list__key', 1).should('contain.text', 'Outcome')
    page
      .getCardElement('outcomeDetails', '.govuk-summary-list__value', 1)
      .should('contain.text', 'User-generated free text content')
    page.getCardElement('outcomeDetails', '.govuk-summary-list__key', 2).should('contain.text', 'RAR activity')
    page.getCardElement('outcomeDetails', '.govuk-summary-list__value', 2).should('contain.text', 'No')
    page.getCardElement('outcomeDetails', '.govuk-summary-list__key', 3).should('contain.text', 'Sensitive')
    page.getCardElement('outcomeDetails', '.govuk-summary-list__value', 3).should('contain.text', 'No')
    page.getCardElement('outcomeDetails', '.govuk-summary-list__key', 4).should('contain.text', 'Notes')
    page
      .getCardElement('outcomeDetails', '.govuk-summary-list__value', 4)
      .should('contain.text', 'Turned up and was very apologetic')

    cy.get('[data-qa="appointmentLastUpdated"]').should('contain.text', 'Last updated by Paul Smith on 20 Mar 2023')

    const cardBody = '[class=app-summary-card__body]'
    page.assertAnchorElementAtIndexWithin(
      cardBody,
      1,
      0,
      'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=UpdateContact&CRN=X000001&contactID=15',
    )
    page.assertAnchorElementAtIndexWithin(cardBody, 1, 1, '/case/X000001/activity-log/activity/15/note/0')
    page.assertAnchorElementAtIndexWithin(cardBody, 1, 2, '/case/X000001/activity-log/activity/15/note/2')
  })
  it('should render an appointment without an outcome', () => {
    cy.visit('/case/X000001/activity-log/activity/16')
    const page = new ActivityLogDetailsPage()
    page.setPageTitle('Office appointment with Terry Jones')
    cy.get('[data-qa="appointmentType"]').should('contain.text', 'National standard appointment')
    cy.get('.note-panel').find('.govuk-warning-text__text').should('contain.text', 'Outcome not recorded')
    cy.get('.note-panel')
      .find('a')
      .should('contain.text', 'Log an outcome')
      .should(
        'have.attr',
        'href',
        'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=UpdateContact&CRN=X000001&contactID=16',
      )
    page.getCardHeader('appointmentDetails').should('contain.text', 'Appointment details')
    page
      .getCardElement('appointmentDetails', '.govuk-summary-list__key', 0)
      .should('contain.text', 'Type of appointment')
    page
      .getCardElement('appointmentDetails', '.govuk-summary-list__value', 0)
      .should('contain.text', 'Office appointment')
    page.getCardElement('appointmentDetails', '.govuk-summary-list__key', 1).should('contain.text', 'Date')
    page
      .getCardElement('appointmentDetails', '.govuk-summary-list__value', 1)
      .should('contain.text', 'Wednesday 21 February')
    page.getCardElement('appointmentDetails', '.govuk-summary-list__key', 2).should('contain.text', 'Time')
    page
      .getCardElement('appointmentDetails', '.govuk-summary-list__value', 2)
      .should('contain.text', '10:15am to 10:30am')
    page.getCardElement('appointmentDetails', '.govuk-summary-list__key', 3).should('contain.text', 'RAR activity')
    page.getCardElement('appointmentDetails', '.govuk-summary-list__value', 3).should('contain.text', 'Not provided')
    page.getCardElement('appointmentDetails', '.govuk-summary-list__key', 4).should('contain.text', 'Appointment notes')
    page.getCardElement('appointmentDetails', '.govuk-summary-list__value', 4).should('contain.text', 'Some notes')
    page.getCardElement('appointmentDetails', '.govuk-summary-list__key', 5).should('contain.text', 'Sensitive')
    page.getCardElement('appointmentDetails', '.govuk-summary-list__value', 5).should('contain.text', 'No')
    page.getCardHeader('outcomeDetails').should('not.exist')
  })
  it('should render a complied appointment with a single selected note', () => {
    cy.visit('/case/X000001/activity-log/activity/15/note/0')
    const page = new ActivityLogDetailsPage()
    const cardBody = '[class=app-summary-card__body]'
    page.assertPageElementAtIndexWithin(cardBody, 1, 'dt', 4, 'Note added by')
    page.assertPageElementAtIndexWithin(cardBody, 1, 'dd', 5, 'Tom Brady')
    page.assertPageElementAtIndexWithin(cardBody, 1, 'dt', 5, 'Date added')
    page.assertPageElementAtIndexWithin(cardBody, 1, 'dd', 6, '29 October 2024')
    page.assertPageElementAtIndexWithin(cardBody, 1, 'dt', 6, 'Note')
    page.assertPageElementAtIndexWithin(cardBody, 1, 'dd', 7, 'Appointment Notes')
  })
  it('should render an appointment and a note has not been recorded', () => {
    cy.visit('/case/X000001/activity-log/activity/12')
    const page = new ActivityLogDetailsPage()
    const cardBody = '[class=app-summary-card__body]'
    page.assertPageElementAtIndexWithin(cardBody, 0, 'dt', 4, 'Appointment notes')
    page.assertPageElementAtIndexWithin(cardBody, 0, 'dd', 4, 'No notes')
  })
  it('should render an appointment and note that has been truncated', () => {
    cy.visit('/case/X000001/activity-log/activity/11/note/1')
    const page = new ActivityLogDetailsPage()
    const cardBody = '[class=app-summary-card__body]'
    page.assertPageElementAtIndexWithin(cardBody, 0, 'dt', 5, 'Note added by')
    page.assertPageElementAtIndexWithin(cardBody, 0, 'dd', 5, 'Tom Brady')
    page.assertPageElementAtIndexWithin(cardBody, 0, 'dt', 6, 'Date added')
    page.assertPageElementAtIndexWithin(cardBody, 0, 'dd', 6, '29 October 2024')
    page.assertPageElementAtIndexWithin(cardBody, 0, 'dt', 7, 'Note')
    page.assertPageElementAtIndexWithin(cardBody, 0, 'dd', 7, 'Email sent to Stuart')
  })
})
