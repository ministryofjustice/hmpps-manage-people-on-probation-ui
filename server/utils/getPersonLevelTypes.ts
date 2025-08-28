import { AppointmentType } from '../models/Appointments'

export const getPersonLevelTypes = (data: AppointmentType[]) => {
  if (!data) {
    return []
  }
  return data.filter(item => item.isPersonLevelContact === true)
}
