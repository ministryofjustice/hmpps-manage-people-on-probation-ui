import appointmentOutcomesController from './appointmentOutcomes'

describe('appointmentOutcomesController', () => {
  const mockReq = {} as any
  const mockRes = {
    render: jest.fn(),
  } as any

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const testCases = [
    ['getOutcome', 'pages/appointments-outcomes/outcome'],
    ['postOutcome', 'pages/appointments-outcomes/outcome'],
    ['getAttendedFailedToComply', 'pages/appointments-outcomes/attended-failed-to-comply'],
    ['postAttendedFailedToComply', 'pages/appointments-outcomes/attended-failed-to-comply'],
    ['getAcceptableAbsence', 'pages/appointments-outcomes/acceptable-absence'],
    ['postAcceptableAbsence', 'pages/appointments-outcomes/acceptable-absence'],
    ['getUnacceptableAbsence', 'pages/appointments-outcomes/unacceptable-absence'],
    ['postUnacceptableAbsence', 'pages/appointments-outcomes/unacceptable-absence'],
    ['getFailedToAttend', 'pages/appointments-outcomes/failed-to-attend'],
    ['postFailedToAttend', 'pages/appointments-outcomes/failed-to-attend'],
    ['getEnforcementAction', 'pages/appointments-outcomes/enforcement-action'],
    ['postEnforcementAction', 'pages/appointments-outcomes/enforcement-action'],
    ['getInitiateBreachOrRecall', 'pages/appointments-outcomes/initiate-breach-or-recall'],
    ['postInitiateBreachOrRecall', 'pages/appointments-outcomes/initiate-breach-or-recall'],
    ['getSendLetter', 'pages/appointments-outcomes/send-letter'],
    ['postSendLetter', 'pages/appointments-outcomes/send-letter'],
    ['getUpdateEnforcementAction', 'pages/appointments-outcomes/update-enforcement-action'],
    ['postUpdateEnforcementAction', 'pages/appointments-outcomes/update-enforcement-action'],
  ] as const

  it.each(testCases)('should render correct view for %s', async (routeName, expectedView) => {
    const handlerFactory = (appointmentOutcomesController as any)[routeName]

    const handler = handlerFactory(null) // hmppsAuthClient not used
    await handler(mockReq, mockRes)

    expect(mockRes.render).toHaveBeenCalledWith(expectedView)
  })
})
