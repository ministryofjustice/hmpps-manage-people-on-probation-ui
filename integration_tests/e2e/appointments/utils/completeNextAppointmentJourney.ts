import { AppointmentSessionSelection } from '../../../../server/models/Appointments'
import ArrangeAnotherAppointmentPage from '../../../pages/appointments/arrange-another-appointment.page'
import AppointmentCheckYourAnswersPage from '../../../pages/appointments/check-your-answers.page'
import { getUuid } from './common'
import { completeAddNotePage } from './completeAddNotePage'
import { completeLocationDateTimePage } from './completeLocationDateTimePage'
import { completeOutcome } from './completeOutcome'
import { completeSentencePage } from './completeSentencePage'
import { completeSupportingInformationPage } from './completeSupportingInformationPage'
import { completeTextMessageConfirmationPage } from './completeTextMessageConfirmationPage'
import { completeTypePage } from './completeTypePage'

let arrangeAnotherAppointmentPage: ArrangeAnotherAppointmentPage
let checkYourAnswersPage: AppointmentCheckYourAnswersPage

export const completeNextAppointmentJourney = ({
  type = 'KEEP_TYPE',
  dateInPast = false,
  isOutcomeJourney = false,
  crn = 'X000001',
}: {
  type?: AppointmentSessionSelection
  dateInPast?: boolean
  isOutcomeJourney?: boolean
  crn?: string
} = {}): void => {
  if (type === 'KEEP_TYPE') {
    arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
    arrangeAnotherAppointmentPage.getSubmitBtn().click()
  }
  getUuid(2).then(uuid => {
    if (type === 'CHANGE_TYPE') {
      completeSentencePage({ loadPage: false, crnOverride: crn, uuidOverride: uuid })
      completeTypePage()
    }
    if (['KEEP_TYPE', 'CHANGE_TYPE'].includes(type)) {
      completeLocationDateTimePage({ dateInPast, crnOverride: crn, uuidOveride: uuid })
    }
    if (!dateInPast) {
      completeTextMessageConfirmationPage({ _crn: crn, _uuid: uuid, index: 1 })
      completeSupportingInformationPage({ crnOverride: crn, uuidOveride: uuid, sensitivityIsLocked: false })
    } else {
      completeOutcome()
      completeAddNotePage({ crnOverride: crn, idOverride: uuid, sensitivityIsLocked: false })
    }
    if (!isOutcomeJourney) {
      checkYourAnswersPage = new AppointmentCheckYourAnswersPage()
      checkYourAnswersPage.getSubmitBtn().click()
    }
  })
}
