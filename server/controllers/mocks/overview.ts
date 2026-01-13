export const mockOverview = {
  absencesWithoutEvidence: 1,
  personalDetails: {
    name: {
      forename: 'Alton',
      surname: 'Berge',
    },
    telephoneNumber: '01211234567',
    mobileNumber: '07703123456',
    preferredName: 'Alton',
    preferredGender: 'Male',
    dateOfBirth: '2012-03-12',
    disabilities: [],
    provisions: [],
    personalCircumstances: [],
  },
  previousOrders: {
    breaches: 0,
    count: 1,
  },
  schedule: {
    nextAppointment: {
      date: '2024-03-09T14:59:05.382936Z[Europe/London]',
      description: 'Initial Appointment - In office (NS)',
    },
  },
  sentences: [
    {
      additionalOffences: [],
      eventNumber: '3',
      mainOffence: {
        code: '18502',
        description: 'Breach of Restraining Order (Protection from Harassment Act 1997) - 00831',
      },
      order: {
        description: 'CJA - Std Determinate Custody',
        endDate: '2024-12-01',
        startDate: '2023-12-01',
      },
      rar: {
        completed: 14,
        scheduled: 2,
        totalDays: 16,
      },
    },
  ],
  activity: {
    acceptableAbsenceCount: 1,
    unacceptableAbsenceCount: 2,
    attendedButDidNotComplyCount: 2,
    outcomeNotRecordedCount: 2,
    waitingForEvidenceCount: 2,
    rescheduledCount: 2,
    absentCount: 2,
    rescheduledByStaffCount: 2,
    rescheduledByPersonOnProbationCount: 2,
    lettersCount: 2,
    nationalStandardAppointmentsCount: 2,
    compliedAppointmentsCount: 3,
  },
  compliance: {
    currentBreaches: 2,
    breachStarted: true,
    breachesOnCurrentOrderCount: 1,
    priorBreachesOnCurrentOrderCount: 1,
    failureToComplyCount: 3,
  },
  registrations: ['Restraining Order', 'Domestic Abuse Perpetrator', 'Risk to Known Adult'],
} as any
