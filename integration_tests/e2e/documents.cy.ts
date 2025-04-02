import Page from '../pages/page'
import SearchPage from '../pages/search'
import DocumentsPage from '../pages/documents'

context('Documents', () => {
  it('Documents page is rendered', () => {
    cy.visit('/case/X000001/documents')
    const page = Page.verifyOnPage(DocumentsPage)

    page.getElementData('statusHeader').should('have.text', 'Status')
    page.getElementData('levelHeader').should('have.text', 'Level')
    page.getElementData('nameHeader').should('have.text', 'Name')
    page.getElementData('typeHeader').should('have.text', 'Type')
    page.getElementData('createdAtHeader').should('have.text', 'Date created')
    page.getElementData('lastUpdatedAtHeader').should('have.text', 'Date modified')

    page.getElementData('levelValue1').should('have.text', 'Level 1')
    page.getElementData('nameValue1').should('contain.text', 'Eula-Schmeler-X000001-UPW-1.pdf')
    page.getElementData('typeValue1').should('contain.text', 'Type 1')
    page.getElementData('dateCreatedValue1').should('have.text', '5 April 2023')
    page.getElementData('dateModifiedValue1').should('have.text', '6 April 2023')

    page.getElementData('levelValue2').should('have.text', 'Level 2')
    page.getElementData('nameValue2').should('contain.text', 'Eula-Schmeler-X000001-UPW-2.pdf')
    page.getElementData('typeValue2').should('contain.text', 'Type 2')
    page.getElementData('dateCreatedValue2').should('have.text', '5 April 2021')
    page.getElementData('dateModifiedValue2').should('have.text', '6 April 2022')

    page.getElementData('levelValue3').should('have.text', 'Level 3')
    page.getElementData('nameValue3').should('contain.text', 'other-doc.pdf')
    page.getElementData('typeValue3').should('contain.text', 'Type 3')
    page.getElementData('dateCreatedValue3').should('have.text', '5 February 2020')
    page.getElementData('dateModifiedValue3').should('have.text', '6 March 2021')
  })

  it('Documents page is rendered with no results', () => {
    cy.visit('/case/X777916/documents')
    const page = Page.verifyOnPage(DocumentsPage)

    page.getElementData('noData').should('have.text', 'There are no documents to display.')
  })
})
