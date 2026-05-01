import Page from '../../pages/page'
import ContactPage from '../../pages/personalDetails/contact'
import ContactGPPage from '../../pages/personalDetails/contact-gp'

context('Contact', () => {
  it('Contact page is rendered', () => {
    cy.visit('/case/X000001/personal-details/personal-contact/2500232995')
    const page = Page.verifyOnPage(ContactPage)
    page.assertAnchorElementAtIndexWithin(
      'p',
      1,
      0,
      'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=PersonalContacts&CRN=X000001',
    )
    page.getRowData('contactRelationshipTypeHeader', 'Value').should('contain.text', 'Emergency Contact')
    page.getRowData('contactNameHeader', 'Value').should('contain.text', 'Brian Smith')
    page.getRowData('contactName', 'Value').should('contain.text', 'Brian Smith')
    page.getRowData('contactRelationshipType', 'Value').should('contain.text', 'Emergency Contact')
    page.getRowData('contactRelationship', 'Value').should('contain.text', 'Father')
    page.getRowData('contactAddress', 'Value').should('contain.text', '36 Fifth Street')
    page.getRowData('contactNotes', 'Value').should('contain.text', 'No notes')
    page.getRowData('lastUpdatedBy', 'Value').should('contain.text', 'Last updated by George NDelius03 on 14 Mar 2023')
  })

  it('Contact page with notes is rendered', () => {
    cy.visit('/case/X000001/personal-details/personal-contact/2500233993')
    const page = Page.verifyOnPage(ContactGPPage)
    page.getRowData('contactNotes', 'Value').should('contain.text', 'Personal Contact')
  })

  it('Contact page with single note is rendered', () => {
    cy.visit('/case/X000001/personal-details/personal-contact/2500233993/note/0')
    const page = Page.verifyOnPage(ContactGPPage)
    page.assertTextAtElementAtIndex('[class=govuk-summary-list__key]', 4, 'Note added by')
    page.assertTextAtElementAtIndex('[class=govuk-summary-list__value]', 4, 'Tom Brady')
    page.assertTextAtElementAtIndex('[class=govuk-summary-list__key]', 5, 'Date added')
    page.assertTextAtElementAtIndex('[class=govuk-summary-list__value]', 5, '30 October 2024')
    page.getRowData('contactNotes', 'Value').should('contain.text', 'Personal Contact')
  })
})
