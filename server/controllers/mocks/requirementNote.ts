import { RequirementNoteDetails } from '../../data/model/requirementNoteDetails'

export const mockRequirementNote = {
  personSummary: {
    name: {
      forename: 'Caroline',
      surname: 'Wolff',
    },
    crn: 'X000001',
    dateOfBirth: '1979-08-18',
  },
  requirement: {
    code: 'F',
    actualStartDate: '2024-04-12',
    description: '3 of 12 RAR days completed',
    length: 12,
    lengthUnitValue: 'Days',
    requirementNote: {
      id: 0,
      createdBy: 'Jon Jones',
      createdByDate: '2024-08-21',
      note: 'Requirement created automatically from the Create and Vary a licence system of\nAllow person(s) as designated by your supervising officer to install an electronic monitoring tag on you and access to install any associated equipment in your property, and for the purpose of ensuring that equipment is functioning correctly. You must not damage or tamper with these devices and ensure that the tag is charged, and report to your supervising officer and the EM provider immediately if the tag or the associated equipment are not working correctly. This will be for the purpose of monitoring your alcohol abstinence licence condition(s) unless otherwise authorised by your supervising officer. Licence Condition created automatically from the Create and Vary a licence system of\nAllow person(s) as designated by your supervising officer to install an electronic monitoring tag on you and access to install any associated equipment in your property, and for the purpose of ensuring that equipment is functioning correctly. You must not damage or tamper with these devices and ensure that the tag is charged, and report to your supervising officer and the EM provider immediately if the tag or the associated equipment are not working correctly. This will be for the purpose of monitoring your alcohol abstinence licence condition(s) unless otherwise authorised by your supervising officer.Licence Condition created automatically from the Create and Vary a licence system of\nAllow person(s) as desi123456\n',
    },
    rar: {
      completed: 1,
      nsiCompleted: 2,
      scheduled: 9,
      totalDays: 12,
    },
  },
} as unknown as RequirementNoteDetails
