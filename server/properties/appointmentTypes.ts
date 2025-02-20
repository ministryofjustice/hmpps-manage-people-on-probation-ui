import { AppointmentTypeOption } from '../@types'

export const appointmentTypes: AppointmentTypeOption[] = [
  {
    text: 'Home visit',
    value: 'HomeVisitToCaseNS',
  },
  {
    text: 'Initial appointment - home visit',
    value: 'InitialAppointmentHomeVisitNS',
  },
  {
    text: 'Initial appointment - in office',
    value: 'InitialAppointmentInOfficeNS',
  },
  {
    text: 'Planned office visit',
    value: 'PlannedOfficeVisitNS',
  },
]
