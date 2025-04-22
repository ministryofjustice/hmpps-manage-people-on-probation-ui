import Page from '../pages/page'
import DocumentsPage from '../pages/documents'

context('Documents', () => {
  it('Documents page is rendered', () => {
    cy.visit('/case/X000001/documents')
    const page = Page.verifyOnPage(DocumentsPage)

    page.getElementData('levelHeader').should('have.text', 'Level')
    page.getElementData('nameHeader').should('have.text', 'Name')
    page.getElementData('typeHeader').should('have.text', 'Type')
    page.getElementData('createdAtHeader').should('have.text', 'Date created')
    page.getElementData('lastUpdatedAtHeader').should('have.text', 'Date modified')

    page.getElementData('levelValue1').should('have.text', 'Level 1')
    page.getElementData('nameValue1').should('contain.text', 'Eula-Schmeler-X000001-UPW-1.pdf')
    page.getElementData('typeValue1').should('contain.text', 'Type 1')
    page.getElementData('dateCreatedValue1').should('have.text', '5 Apr 2023')
    page.getElementData('dateModifiedValue1').should('have.text', '6 Apr 2023')

    page.getElementData('levelValue2').should('have.text', 'Level 2')
    page.getElementData('nameValue2').should('contain.text', 'Eula-Schmeler-X000001-UPW-2.pdf')
    page.getElementData('typeValue2').should('contain.text', 'Type 2')
    page.getElementData('dateCreatedValue2').should('have.text', '5 Apr 2021')
    page.getElementData('dateModifiedValue2').should('have.text', '6 Apr 2022')

    page.getElementData('levelValue3').should('have.text', 'Level 3')
    page.getElementData('nameValue3').should('contain.text', 'other-doc.pdf')
    page.getElementData('typeValue3').should('contain.text', 'Type 3')
    page.getElementData('dateCreatedValue3').should('have.text', '5 Feb 2020')
    page.getElementData('dateModifiedValue3').should('have.text', '6 Mar 2021')
  })

  it('Documents page is rendered with no results', () => {
    cy.visit('/case/X777916/documents')
    const page = Page.verifyOnPage(DocumentsPage)
    page.getElementData('noResults').should('contain.text', '0 search results found')
  })

  it('Documents filter handles dates', () => {
    cy.visit('/case/X000001/documents')
    const page = Page.verifyOnPage(DocumentsPage)
    // Date from entered without date to
    page.getDateFromInput().type('02/04/2025')
    page.getApplyFiltersButton().click()
    page.getElementData('errorList').should('exist')
    page.getElementData('errorList').should('contain.text', 'Enter or select a to date')
    page.getElementData('dateToError').should('contain.text', 'Enter or select a to date')
    // Date to entered without date from
    page.getDateFromInput().clear()
    page.getDateToInput().type('01/04/2025')
    page.getApplyFiltersButton().click()
    page.getElementData('errorList').should('contain.text', 'Enter or select a from date')
    page.getElementData('dateFromError').should('contain.text', 'Enter or select a from date')
    // Date to entered less than from date
    page.getDateFromInput().clear()
    page.getDateToInput().clear()
    page.getDateFromInput().type('02/04/2025')
    page.getDateToInput().type('01/04/2025')
    page.getApplyFiltersButton().click()
    page.getElementData('errorList').should('exist')
    page.getElementData('errorList').should('contain.text', 'The from date must be on or before the to date')
    page.getElementData('errorList').should('contain.text', 'The to date must be on or after the from date')
    page.getElementData('dateFromError').should('contain.text', 'The from date must be on or before the to date')
    page.getElementData('dateToError').should('contain.text', 'The to date must be on or after the from date')
    page.getSelectedFilterTag(1).should('not.exist')
    // Valid date range entered creates filter
    page.getDateFromInput().clear()
    page.getDateToInput().clear()
    page.getDateFromInput().type('1/4/2025')
    page.getDateToInput().type('2/4/2025')
    page.getApplyFiltersButton().click()
    page.getElementData('errorList').should('not.exist')
    page.getElementData('dateFromError').should('not.exist')
    page.getElementData('dateToError').should('not.exist')
    page.getSelectedFilterTag(1).should('contain.text', '1/4/2025 to 2/4/2025')
    // Clear date range
    page.getSelectedFilterTag(1).click()
    page.getSelectedFilterTag(1).should('not.exist')
    page.getDateFromInput().should('be.empty')
    page.getDateToInput().should('be.empty')
  })

  it('Documents filter handles file name only', () => {
    cy.visit('/case/X000001/documents')
    const page = Page.verifyOnPage(DocumentsPage)
    page.getFileNameInput().type('testing')
    page.getDateFromInput().type('1/4/2025')
    page.getDateToInput().type('2/4/2025')
    page.getApplyFiltersButton().click()
    page.getSelectedFilterTag(1).first().should('contain.text', 'testing')
    page.getSelectedFilterTag(1).last().should('contain.text', '1/4/2025 to 2/4/2025')
    // Clear file name
    page.getSelectedFilterTag(1).first().click()
    page.getFileNameInput().should('be.empty')
    page.getSelectedFilterTag(1).first().should('contain.text', '1/4/2025 to 2/4/2025')
    page.getDateFromInput().should('have.value', '1/4/2025')
    page.getDateToInput().should('have.value', '2/4/2025')
  })

  it('Documents clear filters', () => {
    cy.visit('/case/X000001/documents')
    const page = Page.verifyOnPage(DocumentsPage)
    page.getFileNameInput().type('testing')
    page.getDateFromInput().type('1/4/2025')
    page.getDateToInput().type('2/4/2025')
    page.getApplyFiltersButton().click()
    page.getSelectedFilterTag(1).should('contain.text', 'testing')
    page.getSelectedFilterTag(1).should('contain.text', '1/4/2025 to 2/4/2025')
    page.getClearAllLink('X000001').click()
    page.getSelectedFilterTag(1).should('not.exist')
    page.getFileNameInput().should('be.empty')
    page.getDateFromInput().should('be.empty')
    page.getDateToInput().should('be.empty')
  })
})
