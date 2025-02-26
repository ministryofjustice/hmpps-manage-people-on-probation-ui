import Page from '../pages/page'
import PersonalDetailsPage from '../pages/personalDetails'
import PersonalCircumstancesPage from '../pages/personalCircumstances'
import AdjustmentsPage from '../pages/adjustments'

context('Personal Details', () => {
  it('Personal Details page is rendered', () => {
    cy.visit('/case/X000001/personal-details')
    const page = Page.verifyOnPage(PersonalDetailsPage)
    page.assertRiskTags()
    page.headerCrn().should('contain.text', 'X000001')
    page.headerName().should('contain.text', 'Caroline Wolff')
    page.pageHeading().should('contain.text', 'Personal details')
    page.getTab('overview').should('contain.text', 'Overview')
    page.getTab('personalDetails').should('contain.text', 'Personal details')
    page.getTab('risk').should('contain.text', 'Risk')
    page.getTab('sentence').should('contain.text', 'Sentence')
    page.getTab('activityLog').should('contain.text', 'Activity log')
    page.getTab('compliance').should('contain.text', 'Compliance')
    page.getCardHeader('contactDetails').should('contain.text', 'Contact details')
    page.getCardHeader('personalDetails').should('contain.text', 'Personal details')
    page.getCardHeader('identityNumber').should('contain.text', 'Identity numbers')
    page.getCardHeader('staffContacts').should('contain.text', 'Staff contacts')
    page.getCardHeader('equalityMonitoring').should('contain.text', 'Equality monitoring')
    page.getRowData('contactDetails', 'telephoneNumber', 'Value').should('contain.text', '0123456999')
    page.getRowData('contactDetails', 'mobileNumber', 'Value').should('contain.text', '071838893')
    page.getRowData('contactDetails', 'emailAddress', 'Value').should('contain.text', 'address1@gmail.com')
    page.getRowData('contactDetails', 'mainAddress', 'Value').should('contain.text', 'No fixed address')
    page.getRowData('contactDetails', 'otherAddresses', 'Value').should('contain.text', '1 other address')
    page.getRowData('contactDetails', 'contacts', 'Value').should('contain.text', 'Steve Wilson – GP (secondary)')
    page.getRowData('contactDetails', 'mainAddressNotes', 'Value').should('contain.text', 'Main Address')

    page.getRowData('personalDetails', 'name', 'Value').should('contain.text', 'Caroline Wolff')
    page.getRowData('personalDetails', 'dateOfBirth', 'Value').should('contain.text', '18 August 1979')
    page.getRowData('personalDetails', 'aliases', 'Value').should('contain.text', 'Jonny Smith')
    page.getRowData('personalDetails', 'preferredLanguage', 'Value').should('contain.text', 'Urdu')
    page
      .getRowData('personalDetails', 'currentCircumstances', 'Value')
      .should('contain.text', 'Transferred to Crown Court: Is a Primary Carer')
    page
      .getRowData('personalDetails', 'disabilities', 'Value')
      .should('contain.text', 'Mental Health related disabilities')
    page.getRowData('personalDetails', 'adjustments', 'Value').should('contain.text', 'Handrails')
    page
      .getRowData('personalDetails', 'criminogenicNeeds', 'Value')
      .should('contain.text', 'Education, Training and Employability')
    page.getRowData('personalDetails', 'documents', 'Value').should('contain.text', 'Eula-Schmeler-X000001-UPW.pdf')

    page.getRowData('identityNumber', 'crn', 'Value').should('contain.text', 'X000001')
    page.getRowData('identityNumber', 'pnc', 'Value').should('contain.text', '1954/0018147W')
    page.getRowData('identityNumber', 'noms', 'Value').should('contain.text', 'G9566GQ')

    page
      .getRowData('staffContacts', 'staffContactRole', 'Label')
      .should('contain.text', 'Prison Offender Manager (POM)')
    page.getRowData('staffContacts', 'staffContactRole', 'Label').should('contain.text', '(responsible officer)')
    page
      .getRowData('staffContacts', 'staffContactLastUpdated', 'Label')
      .should('contain.text', 'Last updated 30 April 2024')
    page.getRowData('staffContacts', 'staffContactName', 'Value').should('contain.text', 'Arhsimna Xolfo')
    page
      .getRowData('staffContacts', 'staffContactRole', 'Label', 1)
      .should('contain.text', 'Community Offender Manager (COM)')
    page
      .getRowData('staffContacts', 'staffContactLastUpdated', 'Label', 1)
      .should('contain.text', 'Last updated 30 April 2024')
    page.getRowData('staffContacts', 'staffContactName', 'Value', 1).should('contain.text', 'Bruce Wayne')
    page.getCardHeader('staffContacts').find('a').should('contain.text', 'View staff contacts')
    page
      .getCardHeader('staffContacts')
      .find('a')
      .should('have.attr', 'href', '/case/X000001/personal-details/staff-contacts')

    page.getRowData('equalityMonitoring', 'religionOrBelief', 'Value').should('contain.text', 'Scientology')
    page.getRowData('equalityMonitoring', 'sex', 'Value').should('contain.text', 'Female')
    page.getRowData('equalityMonitoring', 'genderIdentity', 'Value').should('contain.text', 'Non-Binary')
    page.getRowData('equalityMonitoring', 'sexualOrientation', 'Value').should('contain.text', 'Heterosexual')
    cy.get('[data-qa="equalityMonitoringDeliusLink"]')
      .should('contain.text', 'View more in NDelius (opens in new tab)')
      .should('have.attr', 'target', '_blank')
      .should(
        'have.attr',
        'href',
        'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=EqualityMonitoring&CRN=X000001',
      )
  })

  it('Personal Details page for a main address with a single note is rendered', () => {
    cy.visit('/case/X000001/personal-details/main-address/note/0')
    const page = Page.verifyOnPage(PersonalDetailsPage)
    page.getRowData('contactDetails', 'mobileNumber', 'Value').should('contain.text', '071838893')
    page.getRowData('contactDetails', 'telephoneNumber', 'Value').should('contain.text', '0123456999')
    page.getRowData('contactDetails', 'otherAddresses', 'Value').should('contain.text', '1 other address')
    page.getRowData('contactDetails', 'contacts', 'Value').should('contain.text', 'Steve Wilson – GP (secondary)')
    page.getRowData('contactDetails', 'mainAddress', 'Value').should('contain.text', 'No fixed address')
    page.getRowData('contactDetails', 'mainAddressNotes', 'Value').should('contain.text', 'Main Address')
    page.getRowData('contactDetails', 'emailAddress', 'Value').should('contain.text', 'address1@gmail.com')
  })

  it('Personal Details page where the main address does not any notes is rendered', () => {
    cy.visit('/case/X778160/personal-details')
    const page = Page.verifyOnPage(PersonalDetailsPage)
    page.getRowData('contactDetails', 'mainAddressNotes', 'Value').should('contain.text', 'No notes')
  })

  it('Personal Details page for a personal circumstance with a single note is rendered', () => {
    cy.visit('/case/X000001/personal-details/circumstances/0/note/0')
    const page = Page.verifyOnPage(PersonalCircumstancesPage)
    page
      .getRowData('personalCircumstances', 'circumstanceType', 'Value')
      .should('contain.text', 'Committed/ Transferred to Crown')
    page
      .getRowData('personalCircumstances', 'circumstanceSubType', 'Value')
      .should('contain.text', 'Life imprisonment (Adult)')
    page.getRowData('personalCircumstances', 'circumstanceStartDate', 'Value').should('contain.text', '3 April 2021')
    page.getRowData('personalCircumstances', 'circumstanceVerified', 'Value').should('contain.text', 'Yes')
    page.getRowData('personalCircumstances', 'circumstanceNoteBaddedBy', 'Value').should('contain.text', 'Harry Kane')
    page
      .getRowData('personalCircumstances', 'circumstanceNoteDateAdded', 'Value')
      .should('contain.text', '29 October 2024')
    page
      .getRowData('personalCircumstances', 'circumstanceNote', 'Value')
      .should(
        'contain.text',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n      Cras vel ligula non eros porttitor tincidunt non vel ipsum. Quisque turpis erat, eleifend vitae tempus eget, posuere sit amet nunc.\n      Maecenas vestibulum diam nibh, non porttitor magna suscipit sed. Aliquam mollis urna turpis, egestas congue elit vehicula nec.\n      Nulla mattis tortor vel elit faucibus, vel vehicula nunc venenatis. Vivamus tortor dolor, convallis eu pulvinar id, venenatis at lorem. Duis dolor tortor, pretium ac interdum non, egestas vitae ipsum. Morbi vitae mi nec orci laoreet finibus. Vivamus ac bibendum diam. Donec eget vestibulum odio. Morbi rhoncus, turpis sed faucibus dapibus, justo enim feugiat velit, vel faucibus libero purus vel nulla. Maecenas eget purus arcu. Mauris consequat tempus pulvinar. Nulla volutpat vel arcu a tincidunt',
      )
  })

  it('Personal Details page for a personal adjustment with a single note is rendered', () => {
    cy.visit('/case/X000001/personal-details/adjustments/0/note/0')
    const page = Page.verifyOnPage(AdjustmentsPage)
    page.getRowData('personalAdjustment', 'adjustmentDescription', 'Value').should('contain.text', 'Hand Rails')
    page.getRowData('personalAdjustment', 'adjustmentStartDate', 'Value').should('contain.text', '3 April 2021')
    page.getRowData('personalAdjustment', 'adjustmentEndDate', 'Value').should('contain.text', '3 April 2025')
    page.getRowData('personalAdjustment', 'adjustmentNoteBaddedBy', 'Value').should('contain.text', 'Harry Kane')
    page.getRowData('personalAdjustment', 'adjustmentNoteDateAdded', 'Value').should('contain.text', '29 October 2024')
    page
      .getRowData('personalAdjustment', 'adjustmentNote', 'Value')
      .should(
        'contain.text',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n      Cras vel ligula non eros porttitor tincidunt non vel ipsum. Quisque turpis erat, eleifend vitae tempus eget, posuere sit amet nunc.\n      Maecenas vestibulum diam nibh, non porttitor magna suscipit sed. Aliquam mollis urna turpis, egestas congue elit vehicula nec.\n      Nulla mattis tortor vel elit faucibus, vel vehicula nunc venenatis. Vivamus tortor dolor, convallis eu pulvinar id, venenatis at lorem. Duis dolor tortor, pretium ac interdum non, egestas vitae ipsum. Morbi vitae mi nec orci laoreet finibus. Vivamus ac bibendum diam. Donec eget vestibulum odio. Morbi rhoncus, turpis sed faucibus dapibus, justo enim feugiat velit, vel faucibus libero purus vel nulla. Maecenas eget purus arcu. Mauris consequat tempus pulvinar. Nulla volutpat vel arcu a tincidunt',
      )
  })
})
