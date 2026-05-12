import AddNotePage from '../../../pages/appointments/add-note.page'
import { crn, uuid } from '../imports/common'

export const completeAddNotePage = ({
  crnOverride = '',
  uuidOverride = '',
}: { crnOverride?: string; uuidOverride?: string } = {}) => {
  const addNotePage = new AddNotePage()
  addNotePage.getSensitiveInformation().find('.govuk-radios__item').eq(0).find('.govuk-radios__input').click()
  addNotePage
    .getElement(`#appointments-${crnOverride || crn}-${uuidOverride || uuid}-notes`)
    .focus()
    .type('Some notes')
  addNotePage.getSubmitBtn().click()
}
