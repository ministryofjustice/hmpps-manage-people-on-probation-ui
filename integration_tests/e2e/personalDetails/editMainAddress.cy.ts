import EditMainAddress from '../../pages/personalDetails/editMainAddress'
import mockResponse from '../../../wiremock/mappings/X000001-personal-detail.json'
import { AddressType, PersonAddress } from '../../../server/data/model/personalDetails'
import Page from '../../pages/page'
import { getWiremockData, Wiremock } from '../../utils'

const mockData = mockResponse as Wiremock

const mainAddress = getWiremockData<PersonAddress>(mockData, '/mas/personal-details/X000001', 'mainAddress')

const { buildingName, buildingNumber, streetName, district, town, county, postcode } = mainAddress

const optionalFields = [
  ['buildingName', 'Building name', buildingName],
  ['buildingNumber', 'House number', buildingNumber],
  ['streetName', 'Street name', streetName],
  ['district', 'District', district],
  ['town', 'Town or city', town],
  ['county', 'County', county],
  ['postcode', 'Postcode', postcode],
]

context('Edit main address', () => {
  it('Edit main address page is rendered', () => {
    cy.visit('/case/X000001/personal-details/edit-main-address')
    const page = new EditMainAddress()
    const addressTypes = getWiremockData<AddressType[]>(mockData, '/mas/personal-details/X000001', 'addressTypes')
    page.checkPageTitle('Edit main address for Caroline')
    page
      .getElementData('noFixedAddressGroup')
      .find('.govuk-label--s')
      .should('contain.text', 'Select if they have no fixed main address')
    page.getCheckboxField('noFixedAddress').should('be.checked')
    page
      .getElementData('noFixedAddressGroup')
      .find('.govuk-checkboxes__label')
      .should('contain.text', 'No fixed address')

    page.getElementData('addressType').find('label').should('contain.text', 'Type')

    page.getElement('#addressTypeCode option').each(($el, index) => {
      if (index) {
        const { code, description } = addressTypes[index - 1]
        cy.wrap($el).should('have.value', code).should('contain.text', description)
      }
    })
    page.getElementData('addressType').find('option:selected').should('have.value', addressTypes[2].code)

    page.getElementData('verified').find('legend').should('contain.text', 'Is the address verified?')

    page.getElementData('verified').find('.govuk-radios__item').eq(0).find('input').should('be.checked')
    page.getElementData('verified').find('.govuk-radios__item').eq(0).find('label').should('contain.text', 'Yes')
    page.getElementData('verified').find('.govuk-radios__item').eq(1).find('input').should('not.be.checked')
    page.getElementData('verified').find('.govuk-radios__item').eq(1).find('label').should('contain.text', 'No')

    page.getElementData('startDate').find('label').should('contain.text', 'Start date')
    page.getElementData('startDate').find('.govuk-hint').should('contain.text', 'For example, 17/5/2024.')
    page.getElementData('startDate').find('input').should('have.value', '14/3/2023')

    page.getElementData('endDate').find('label').should('contain.text', 'End date (optional)')
    page.getElementData('endDate').find('.govuk-hint').should('contain.text', 'For example, 17/5/2024.')

    page.getElementData('addressNotes').find('p').eq(0).should('contain.text', 'Previous notes')
    page
      .getElementData('addressNotes')
      .find('.app-note')
      .eq(0)
      .should('contain.text', 'Main Address created automatically')
    page
      .getElementData('addressNotes')
      .find('.app-note__author')
      .eq(0)
      .should('contain.text', 'Comment added by Tom Brady on 29 October 2024')
    page.getElementData('addressNotes').find('.app-note').eq(1).should('contain.text', 'main address note 2')
    page
      .getElementData('addressNotes')
      .find('.app-note__author')
      .eq(1)
      .should('contain.text', 'Comment added by not entered')
    page.getElementData('addressNotes').find('.app-note').eq(2).should('contain.text', 'main address note 1')
    page
      .getElementData('addressNotes')
      .find('.app-note__author')
      .eq(2)
      .should('contain.text', 'Comment added by not entered')
    page.getElementData('notes').find('label').should('contain.text', 'Notes (optional)')
    page.getElementData('notes').find('textarea').should('have.value', '')

    page.getElementData('buildingName').should('not.be.visible')
    page.getElementData('buildingNumber').should('not.be.visible')
    page.getElementData('streetName').should('not.be.visible')
    page.getElementData('district').should('not.be.visible')
    page.getElementData('town').should('not.be.visible')
    page.getElementData('county').should('not.be.visible')
    page.getElementData('postcode').should('not.be.visible')

    page.getElementData('submitBtn').should('contain.text', 'Save changes')
    page
      .getElementData('cancelBtn')
      .should('contain.text', 'Cancel and go back')
      .should('have.attr', 'href', '/case/X000001/personal-details')
  })
  it('Should render the page with no previous address notes', () => {
    cy.visit('/case/X778160/personal-details/edit-main-address')
    const page = new EditMainAddress()
    page.getElementData('addressNotes').find('p').eq(0).should('contain.text', 'Previous notes')
    page.getElementData('addressNotes').find('p').eq(1).should('contain.text', 'No notes')
  })
  it('Submitting without selecting an address type should show errors', () => {
    cy.visit('/case/X000001/personal-details/edit-main-address')
    const page = new EditMainAddress()
    const expectedError = 'Select an address type'
    page.getElementData('addressType').find('select').select('')
    page.getElementData('submitBtn').click()
    page.getErrorSummaryLink(0).should('contain.text', expectedError)
    page.getElementData('addressTypeError').should('be.visible').should('contain.text', expectedError)
  })
  it('Submitting without entering or selecting a start date should show errors', () => {
    cy.visit('/case/X000001/personal-details/edit-main-address')
    const page = new EditMainAddress()
    const expectedError = 'Enter or select a start date'
    page.getElementData('startDate').find('input').clear()
    page.getElementData('submitBtn').click()
    page.getErrorSummaryLink(0).should('contain.text', expectedError)
    page.getElementData('startDateError').should('be.visible').should('contain.text', expectedError)
  })
  it('Submitting with an end date should stay on edit page with warning banner, then second submit will redirect to Personal details screen with update banner', () => {
    cy.visit('/case/X000001/personal-details/edit-main-address')
    const page = Page.verifyOnPage(EditMainAddress)
    page.getElementInput('endDate').type('03/02/2025')
    page.getElementData('submitBtn').click()
    page
      .getElementData('infoBanner')
      .should(
        'contain.text',
        'An end date will change this to a previous address and you will need to add a new main address.',
      )
    page.getElementData('verified').find('.govuk-radios__item').eq(0).click()
    page.getElementData('submitBtn').click()
    page.getElementData('updateBanner').should('contain.text', 'Contact details saved')
  })
  it('Submitting with a dates later than today should show error messages', () => {
    cy.visit('/case/X000001/personal-details/edit-main-address')
    const page = Page.verifyOnPage(EditMainAddress)
    page.getElementInput('endDate').type('03/02/2099')
    page.getElementInput('startDate').clear().type('03/02/2099')
    page.getElementData('submitBtn').click()
    page.getElementData('endDateError').should('contain.text', 'End date can not be later than today.')
    page.getElementData('startDateError').should('contain.text', 'Start date can not be later than today.')
  })
  it('Submitting an invalid start date should show error messages', () => {
    const expectedError = 'Enter or select a start date.'
    cy.visit('/case/X000001/personal-details/edit-main-address')
    const page = Page.verifyOnPage(EditMainAddress)
    page.getElementInput('startDate').clear().type('00/15/2024')
    page.getElementData('submitBtn').click()
    page.getErrorSummaryLink(0).should('contain.text', expectedError)
    page.getElementData('startDateError').should('be.visible').should('contain.text', expectedError)
  })
  it('Submitting an invalid end date should show error messages', () => {
    const expectedError = 'Enter or select an end date.'
    cy.visit('/case/X000001/personal-details/edit-main-address')
    const page = Page.verifyOnPage(EditMainAddress)
    page.getElementInput('endDate').clear().type('00/15/2028')
    page.getElementData('submitBtn').click()
    page.getErrorSummaryLink(0).should('contain.text', expectedError)
    page.getElementData('endDateError').should('be.visible').should('contain.text', expectedError)
  })
  it('Submitting the form with address verified and no start date should persist the address verified selection', () => {
    cy.visit('/case/X000001/personal-details/edit-main-address')
    const page = Page.verifyOnPage(EditMainAddress)
    page.getElementData('verified').find('.govuk-radios__item').eq(0).find('input').click()
    page.getElementInput('startDate').clear()
    page.getElementData('submitBtn').click()
    page.getElementData('verified').find('.govuk-radios__item').eq(0).find('input').should('be.checked')
    page.getElementData('verified').find('.govuk-radios__item').eq(1).find('input').click()
    page.getElementData('submitBtn').click()
    page.getElementData('verified').find('.govuk-radios__item').eq(1).find('input').should('be.checked')
  })
  it('Submitting no fixed address successfully should redirect to Personal details screen with update banner', () => {
    cy.visit('/case/X000001/personal-details/edit-main-address')
    const page = Page.verifyOnPage(EditMainAddress)
    page.getElementData('submitBtn').click()
    page.getElementData('updateBanner').should('contain.text', 'Contact details saved')
  })
  it('Unchecking no fixed address should display the address fields', () => {
    cy.visit('/case/X000001/personal-details/edit-main-address')
    const page = Page.verifyOnPage(EditMainAddress)
    page.getCheckboxField('noFixedAddress').click()

    for (const field of optionalFields) {
      page.getElementData(field[0]).should('be.visible').find('label').should('contain.text', `${field[1]} (optional)`)
      page
        .getElementData(field[0])
        .find('input')
        .should('have.value', field[2] || '')
    }
  })
  it('Checking no fixed address, removing start address and submitting should persist the checkbox selection and not show address fields', () => {
    cy.visit('/case/X000001/personal-details/edit-main-address')
    const page = Page.verifyOnPage(EditMainAddress)
    page.getCheckboxField('noFixedAddress').click()
    page.getElementInput('startDate').clear()
    page.getElementData('submitBtn').click()
    page.getCheckboxField('noFixedAddress').should('not.be.checked')
    page.getElementInput('buildingName').should('be.visible')
  })
  it('Unchecking no fixed address and removing start address should persist the checkbox selection and show address fields', () => {
    cy.visit('/case/X000001/personal-details/edit-main-address')
    const page = Page.verifyOnPage(EditMainAddress)
    page.getElementInput('startDate').clear()
    page.getElementData('submitBtn').click()
    page.getCheckboxField('noFixedAddress').should('be.checked')
    page.getElementInput('buildingName').should('not.be.visible')
  })
  it('Submitting with no fixed address unchecked and no address details filled, should redirect to Personal details screen and update banner', () => {
    cy.visit('/case/X000001/personal-details/edit-main-address')
    const page = Page.verifyOnPage(EditMainAddress)
    page.getCheckboxField('noFixedAddress').click()
    for (const field of optionalFields) {
      page.getElementData(field[0]).find('input').clear()
    }
    page.getElementData('submitBtn').click()
    page.getElementData('updateBanner').should('contain.text', 'Contact details saved')
  })
  it('Submitting with no fixed address unchecked and address details filled, should redirect to Personal details screen and update banner', () => {
    cy.visit('/case/X000001/personal-details/edit-main-address')
    const page = Page.verifyOnPage(EditMainAddress)
    page.getCheckboxField('noFixedAddress').click()
    page.getElementData('submitBtn').click()
    page.getElementData('updateBanner').should('contain.text', 'Contact details saved')
  })
})
