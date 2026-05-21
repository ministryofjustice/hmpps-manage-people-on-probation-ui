export const uncheckAllRadios = () => {
  cy.get('body')
    .find(`input.govuk-radios__input`)
    .then($checked => {
      if ($checked.length > 0) {
        cy.wrap($checked).each($radio => {
          cy.wrap($radio).invoke('prop', 'checked', false).trigger('change')
        })
      }
    })
}
