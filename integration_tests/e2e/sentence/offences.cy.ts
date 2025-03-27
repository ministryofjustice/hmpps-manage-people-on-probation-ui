import Page from '../../pages/page'
import OffencesPage from '../../pages/sentence/offences'

context('Sentence', () => {
  it('Sentence page is rendered', () => {
    cy.visit('/case/X000001/sentence/offences/3')

    const page = Page.verifyOnPage(OffencesPage)
    cy.get('h1').contains('Offences')
    cy.get('h2').contains('Additional offences')

    cy.get('section')
      .eq(0)
      .within(() => cy.get('h2').contains('Main offence'))
    page.assertPageElementAtIndexWithin('section', 0, 'dt', 0, 'Offence')
    page.assertPageElementAtIndexWithin('section', 0, 'dt', 1, 'Category')
    page.assertPageElementAtIndexWithin('section', 0, 'dt', 2, 'Offence date')
    page.assertPageElementAtIndexWithin('section', 0, 'dt', 3, 'Notes')
    page.assertPageElementAtIndexWithin(
      'section',
      0,
      'dd',
      0,
      'Possessing etc firearm or ammunition without firearm certificate (Group 1) - 08103 (1 count)',
    )
    page.assertPageElementAtIndexWithin('section', 0, 'dd', 1, 'Firearms offences')
    page.assertPageElementAtIndexWithin('section', 0, 'dd', 2, '23 April 2024')
    page.assertPageElementAtIndexWithin('section', 0, 'dd', 3, 'overview')

    cy.get('section')
      .eq(1)
      .within(() => cy.get('h2').contains('Additional offence (00600)'))
    page.assertPageElementAtIndexWithin('section', 1, 'dt', 0, 'Offence')
    page.assertPageElementAtIndexWithin('section', 1, 'dt', 1, 'Category')
    page.assertPageElementAtIndexWithin('section', 1, 'dt', 2, 'Offence date')
    page.assertPageElementAtIndexWithin('section', 1, 'dd', 0, 'Endangering railway passengers - 00600')
    page.assertPageElementAtIndexWithin('section', 1, 'dd', 1, 'Endangering railway passengers')
    page.assertPageElementAtIndexWithin('section', 1, 'dd', 2, '22 March 2024')

    cy.get('section')
      .eq(2)
      .within(() => cy.get('h2').contains('Additional offence (08505)'))
    page.assertPageElementAtIndexWithin('section', 2, 'dt', 0, 'Offence')
    page.assertPageElementAtIndexWithin('section', 2, 'dt', 1, 'Category')
    page.assertPageElementAtIndexWithin('section', 2, 'dt', 2, 'Offence date')
    page.assertPageElementAtIndexWithin('section', 2, 'dd', 0, 'Contravene court remedy order (S.42) - 08505')
    page.assertPageElementAtIndexWithin('section', 2, 'dd', 1, 'Health and Safety at Work etc Act 1974')
    page.assertPageElementAtIndexWithin('section', 2, 'dd', 2, '21 February 2024')
  })
})
