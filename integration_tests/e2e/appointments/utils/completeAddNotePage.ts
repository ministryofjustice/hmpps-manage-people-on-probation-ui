import AddNotePage from '../../../pages/appointments/add-note.page'
import { crn, uuid, appointmentId } from '../imports/common'

export const completeAddNotePage = ({
  crnOverride = '',
  idOverride = '',
  journey = 'ARRANGE',
}: { crnOverride?: string; idOverride?: string; journey?: 'ARRANGE' | 'MANAGE' } = {}) => {
  let id = journey === 'ARRANGE' ? uuid : appointmentId
  if (idOverride) id = idOverride
  const addNotePage = new AddNotePage()
  addNotePage.getSensitiveInformation().find('.govuk-radios__item').eq(0).find('.govuk-radios__input').click()
  addNotePage
    .getElement(`#appointments-${crnOverride || crn}-${id}-notes`)
    .focus()
    .type('Some notes')
  addNotePage.getSubmitBtn().click()
}
