import superagent, { SuperAgentRequest } from 'superagent'

const defaultFrontendContext = () => ({
  currentPhase: {
    supervisionPackage: { code: 'STD', description: 'Standard' },
    phase: { code: 'STD', description: 'Standard supervision' },
    eventNumber: '1',
    startDate: '2024-01-01',
    endDate: '2025-01-01',
  },
  earlyEngagement: {
    startDate: '2024-01-01',
    endDate: '2024-02-01',
    weeks: 4,
    completed: 4,
  },
  currentYear: {
    startDate: '2024-01-01',
    endDate: '2025-01-01',
    proRataFromDate: '2024-01-01',
    appointments: { allowance: 12, scheduled: 2, completed: 5 },
    isFirstYear: true,
  },
  nextAppointment: {
    id: 1,
    date: '2024-06-01',
    startTime: '2024-06-01T14:00:00',
    type: { code: 'HV', description: 'Home visit' },
    description: 'Home visit',
  },
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  context: {
    name: { forename: 'Caroline', middleNames: '', surname: 'Wolff' },
    gender: 'Female',
    sentences: [
      {
        eventNumber: '1',
        startDate: '2024-01-01',
        endDate: '2025-01-01',
        supervisionPackage: { code: 'STD', description: 'Standard' },
        type: { code: 'NP', description: 'ORA Community Order', isCustodial: false },
        inBreach: false,
      },
    ],
    integratedOffenderManagementRedRated: false,
    offenderPersonalDisorderPathway: false,
    intensiveSupervisionCourt: false,
    nationalSecurityDivision: false,
    finalThirdEligibility: { eligible: false, since: '2024-01-01' },
  },
})

const stubSupervisionPackageFrontendContext = ({
  crn,
  frontendContext = defaultFrontendContext(),
  status = 200,
}: {
  crn: string
  frontendContext?: Record<string, unknown> | null
  status?: number
}): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPath: `/supervision-packages/frontend-context/${crn}`,
      method: 'GET',
    },
    response: {
      status,
      jsonBody: frontendContext,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default { stubSupervisionPackageFrontendContext }
