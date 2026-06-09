import Page from '../../pages/page'

export interface ExpectedOption<TPage extends Page> {
  value: string
  text: string
  hint?: string
  RedirectPage?: Constructor<TPage>
  redirectPageName?: string
  redirectPageTitle?: string
}

export type Journey = 'MANAGE' | 'RESCHEDULE' | 'ARRANGE'

type Constructor<T = any> = new (...args: any[]) => T

export const checkOptions = <TPage extends Page>(options: ExpectedOption<TPage>[], radioGroupIndex = 0): void => {
  options.forEach(({ value, text, hint }, index) => {
    cy.get('[data-module="govuk-radios"]')
      .eq(radioGroupIndex)
      .find('.govuk-radios__item')
      .eq(index)
      .find('label')
      .should('contain.text', text)
    if (hint) {
      cy.get('[data-module="govuk-radios"]')
        .eq(radioGroupIndex)
        .find('.govuk-radios__item')
        .eq(index)
        .find('.govuk-hint')
        .should('contain.text', hint)
    }
    cy.get('[data-module="govuk-radios"]')
      .eq(radioGroupIndex)
      .find(`.govuk-radios__input[value=${value}]`)
      .should('exist')
  })
}

export const checkOptionRedirectsToCorrectPage = <TPage extends Page, TArgs extends Record<string, any>>(
  options: ExpectedOption<TPage>[],
  loadPageFunc: (args: any) => void,
  args: TArgs = {} as TArgs,
): void => {
  options.forEach(({ value, RedirectPage, redirectPageTitle }) => {
    loadPageFunc(args)
    const outcomePage = new args.Page()
    cy.get(`.govuk-radios__input[value=${value}]`).click()
    outcomePage.getSubmitBtn().click()
    const page = new RedirectPage()
    page.checkPageTitle(redirectPageTitle)
  })
}

export const checkBreachWarningBanner = <TArgs extends Record<string, any>>(
  loadPageFunc: (args: any) => void,
  args: TArgs = {} as TArgs,
): void => {
  describe('breach warning banner', () => {
    it('should show when there is a breach', () => {
      cy.task('stubBreachCompliance')
      loadPageFunc(args)
      const page = new args.Page()
      page.getBreachWarning().should('exist')
    })
    it.only('should not show when there is no active breach', () => {
      loadPageFunc(args)
      const page = new args.Page()
      page.getBreachWarning().should('not.exist')
    })
  })
}
