import AddNotePage from '../../../pages/appointments/add-note.page'
import { crn, uuid, appointmentId } from '../imports/common'

export const completeAddNotePage = ({
  crnOverride = '',
  idOverride = '',
  journey = 'ARRANGE',
  value = 'Some notes',
  sensitivityIndex = 0,
}: {
  crnOverride?: string
  idOverride?: string
  journey?: 'ARRANGE' | 'MANAGE'
  value?: string
  sensitivityIndex?: number
} = {}) => {
  let id = journey === 'ARRANGE' ? uuid : appointmentId
  if (idOverride) id = idOverride
  const addNotePage = new AddNotePage()
  addNotePage
    .getElement(`#appointments-${crnOverride || crn}-${id}-notes`)
    .focus()
    .clear()
    .type(value)
  addNotePage
    .getSensitiveInformation()
    .find('.govuk-radios__item')
    .eq(sensitivityIndex)
    .find('.govuk-radios__input')
    .click()
  addNotePage.getSubmitBtn().click()
}
