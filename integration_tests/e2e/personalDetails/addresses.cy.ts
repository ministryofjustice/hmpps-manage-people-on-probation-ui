import Page from '../../pages/page'
import AddressPage from '../../pages/personalDetails/address'

context('Addresses', () => {
  it('Addresses page is rendered', () => {
    cy.visit('/case/X000001/personal-details/addresses')
    const page = Page.verifyOnPage(AddressPage)

    const url =
      'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=AddressandAccommodation&CRN=X000001'

    page.assertAnchorElementAtIndex('p', 1, url)
    page.assertTextElementAtIndex('p', 1, 'Edit all other addresses on NDelius (opens in new tab)')

    page.getTableHeader('mainAddress').should('contain.text', 'Main address – Since 14 Mar 2023')
    cy.get('[data-qa="changeMainAddressLink"]')
      .should('contain.text', 'Change')
      .should('contain.html', '<span class="govuk-visually-hidden"> main address</span>')
      .should('have.attr', 'href', '/case/X000001/personal-details/edit-main-address')
    page.getTableHeader('otherAddress1').should('contain.text', 'Postal address – Since 14 Mar 2023')
    page.getTableHeader('previousAddress1').should('contain.text', 'Previous address – 14 Mar 2022 to 17 Jan 2023')

    page.getRowData('mainAddress', 'addressStatus', 'Value').should('contain.text', 'Main address')
    page.getRowData('mainAddress', 'address', 'Value').should('contain.text', '32 SCOTLAND STREET')
    page.getRowData('mainAddress', 'addressTelephone', 'Value').should('contain.text', '0191765438')
    page
      .getRowData('mainAddress', 'addressType', 'Value')
      .should('contain.text', 'Householder (Owner - freehold or leasehold) (verified)')
    page.getRowData('mainAddress', 'addressStartDate', 'Value').should('contain.text', '14 March 2023')
    page.assertPageElementAtIndexWithin('section', 0, 'dd', 5, 'No notes')
    page
      .getRowData('mainAddress', 'addressLastUpdatedBy', 'Value')
      .should('contain.text', 'Last updated by Paul Smith on 20 Mar 2023')

    page.getRowData('otherAddress1', 'otherAddressStatus', 'Value1').should('contain.text', 'Postal address')
    page.getRowData('otherAddress1', 'otherAddress', 'Value1').should('contain.text', '32 Other Street')
    page
      .getRowData('otherAddress1', 'otherAddressType', 'Value1')
      .should('contain.text', 'Householder (Owner - freehold or leasehold) (not verified)')
    page.getRowData('otherAddress1', 'otherAddressStartDate', 'Value1').should('contain.text', '14 March 2023')
    page.assertPageElementAtIndexWithin('section', 1, 'dd', 4, 'Other Address')
    page
      .getRowData('otherAddress1', 'otherAddressLastUpdatedBy', 'Value1')
      .should('contain.text', 'Last updated by Joe Bloggs on 20 Mar 2023')

    page.getRowData('previousAddress1', 'previousAddressStatus', 'Value1').should('contain.text', 'Previous address')
    page.getRowData('previousAddress1', 'previousAddress', 'Value1').should('contain.text', '32 Previous Street')
    page
      .getRowData('previousAddress1', 'previousAddressType', 'Value1')
      .should('contain.text', 'Householder (Owner - freehold or leasehold) (verified)')
    page.getRowData('previousAddress1', 'previousAddressStartDate', 'Value1').should('contain.text', '14 March 2022')
    page.assertPageElementAtIndexWithin('section', 2, 'dd', 4, 'Previous Address')
    page
      .getRowData('previousAddress1', 'previousAddressLastUpdatedBy', 'Value1')
      .should('contain.text', 'Last updated by Jim Smith on 20 Mar 2023')
  })

  it('Addresses page for a single note for a Other Address is rendered', () => {
    cy.visit('/case/X000001/personal-details/addresses/3/note/0')
    const page = Page.verifyOnPage(AddressPage)

    page.assertPageElementAtIndexWithin('section', 0, 'dd', 4, 'Other Address')
  })

  it('Addresses page for a single note for a Previous Address is rendered', () => {
    cy.visit('/case/X000001/personal-details/addresses/7/note/0')
    const page = Page.verifyOnPage(AddressPage)

    page.assertPageElementAtIndexWithin('section', 0, 'dd', 6, 'Previous Address')
  })

  it('should render the page for a PP with no main address', () => {
    cy.visit('/case/X778160/personal-details/addresses')
    cy.get('[data-qa="mainAddressSection"]').find('p').eq(0).should('contain.text', 'There is no main address.')
    cy.get('[data-qa="mainAddressSection"]')
      .find('p')
      .eq(1)
      .find('a')
      .should('contain.text', 'Add main address')
      .should('have.attr', 'href', '/case/X778160/personal-details/edit-contact-details')
    cy.get('[data-qa="mainAddressSection"] section').should('not.exist')
  })
})
