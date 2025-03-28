import { LicenceConditionNoteDetails } from '../../data/model/licenceConditionNoteDetails'

export const mockLicenceConditionNote = {
  personSummary: {
    name: {
      forename: 'Caroline',
      surname: 'Wolff',
    },
    crn: 'X000001',
    dateOfBirth: '1979-08-18',
  },
  licenceCondition: {
    id: 7007,
    mainDescription: 'Freedom of movement',
    imposedReleasedDate: '2022-02-04',
  },
} as unknown as LicenceConditionNoteDetails
