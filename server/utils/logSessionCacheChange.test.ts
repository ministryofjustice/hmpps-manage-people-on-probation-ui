import logger from '../../logger'
import { logFieldPresence, logSessionCacheChange } from './logSessionCacheChange'

jest.mock('../../logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
}))

const mockedLogger = logger as jest.Mocked<typeof logger>
const enabledContext = { enabled: true }

describe('utils/logSessionCacheChange', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('logSessionCacheChange', () => {
    it('returns and logs "added" (at debug level) when there was no previous value', () => {
      const data = { appointments: { X000001: { user: {} } } }
      const action = logSessionCacheChange(
        'testSource',
        data,
        ['appointments', 'X000001', 'user', 'name'],
        'Joe Bloggs',
        enabledContext,
      )

      expect(action).toEqual('added')
      expect(mockedLogger.debug).toHaveBeenCalledTimes(1)
      expect(mockedLogger.info).not.toHaveBeenCalled()
      const [fields, message] = mockedLogger.debug.mock.calls[0]
      expect(fields).toMatchObject({ event: 'sessionCache', source: 'testSource', action: 'added' })
      expect(message).toEqual('[sessionCache] added')
    })

    it('returns and logs "cleared" (at info level) when a previous value is removed', () => {
      const data = { appointments: { X000001: { user: { name: 'Joe Bloggs' } } } }
      const action = logSessionCacheChange(
        'testSource',
        data,
        ['appointments', 'X000001', 'user', 'name'],
        null,
        enabledContext,
      )

      expect(action).toEqual('cleared')
      expect(mockedLogger.info).toHaveBeenCalledTimes(1)
      expect(mockedLogger.debug).not.toHaveBeenCalled()
      const [fields] = mockedLogger.info.mock.calls[0]
      expect(fields).toMatchObject({ action: 'cleared' })
    })

    it('returns and logs "unchanged" (at debug level) when the value is the same primitive', () => {
      const data = { appointments: { X000001: { user: { providerCode: 'N07' } } } }
      const action = logSessionCacheChange(
        'testSource',
        data,
        ['appointments', 'X000001', 'user', 'providerCode'],
        'N07',
        enabledContext,
      )

      expect(action).toEqual('unchanged')
      expect(mockedLogger.debug).toHaveBeenCalledTimes(1)
      expect(mockedLogger.info).not.toHaveBeenCalled()
    })

    it('returns and logs "overwritten" (at info level) when the value changes to a different primitive', () => {
      const data = { appointments: { X000001: { user: { providerCode: 'N07' } } } }
      const action = logSessionCacheChange(
        'testSource',
        data,
        ['appointments', 'X000001', 'user', 'providerCode'],
        'N08',
        enabledContext,
      )

      expect(action).toEqual('overwritten')
      expect(mockedLogger.info).toHaveBeenCalledTimes(1)
      expect(mockedLogger.debug).not.toHaveBeenCalled()
    })

    it('returns "unchanged" when a different object reference has identical content', () => {
      const data = { providers: { user1: [{ code: 'N07' }] } }
      const newValue = [{ code: 'N07' }]
      const action = logSessionCacheChange('testSource', data, ['providers', 'user1'], newValue, enabledContext)

      expect(action).toEqual('unchanged')
      expect(mockedLogger.debug).toHaveBeenCalledTimes(1)
      expect(mockedLogger.info).not.toHaveBeenCalled()
    })

    it('returns "overwritten" when a different object reference has different content', () => {
      const data = { providers: { user1: [{ code: 'N07' }] } }
      const newValue = [{ code: 'N08' }]
      const action = logSessionCacheChange('testSource', data, ['providers', 'user1'], newValue, enabledContext)

      expect(action).toEqual('overwritten')
      expect(mockedLogger.info).toHaveBeenCalledTimes(1)
    })

    it('returns and logs "unknown" (at info level, never throwing) when the values cannot be safely compared', () => {
      const circular: Record<string, unknown> = { code: 'N07' }
      circular.self = circular
      const data = { providers: { user1: { code: 'N06' } } }

      let action: string
      expect(() => {
        action = logSessionCacheChange('testSource', data, ['providers', 'user1'], circular, enabledContext)
      }).not.toThrow()

      expect(action).toEqual('unknown')
      expect(mockedLogger.info).toHaveBeenCalledTimes(1)
      expect(mockedLogger.debug).not.toHaveBeenCalled()
      const [fields] = mockedLogger.info.mock.calls[0]
      expect(fields).toMatchObject({ action: 'unknown' })
    })

    it('replaces crn/uuid path segments with CRN/UUID placeholders, keeping them as separate fields', () => {
      const uuid = '5118044b-2092-4151-8472-625e9cbf8543'
      const crn = 'X991651'
      const data = { appointments: { [crn]: { [uuid]: { user: { providerCode: 'N07' } } } } }

      logSessionCacheChange(
        'testSource',
        data,
        ['appointments', crn, uuid, 'user', 'providerCode'],
        'N07',
        enabledContext,
      )

      const [fields] = mockedLogger.debug.mock.calls[0]
      expect(fields).toMatchObject({
        path: 'appointments.CRN.UUID.user.providerCode',
        uuid,
        crn,
      })
    })

    it('uses explicitly supplied uuid/username/crn context over ones inferred from the path', () => {
      const data = { temp: { X991651: { responseContactId: '123' } } }

      logSessionCacheChange('testSource', data, ['temp', 'X991651', 'responseContactId'], null, {
        uuid: 'explicit-uuid',
        crn: 'explicit-crn',
        username: 'explicit-user',
        enabled: true,
      })

      const [fields] = mockedLogger.info.mock.calls[0]
      expect(fields).toMatchObject({
        uuid: 'explicit-uuid',
        crn: 'explicit-crn',
        username: 'explicit-user',
      })
    })

    it('does not include uuid/crn/username fields when none are present or inferrable', () => {
      const data = { backLink: {} }
      logSessionCacheChange('testSource', data, ['backLink', 'sentence'], 'value', enabledContext)

      const [fields] = mockedLogger.debug.mock.calls[0]
      expect(fields).not.toHaveProperty('uuid')
      expect(fields).not.toHaveProperty('crn')
      expect(fields).not.toHaveProperty('username')
    })

    it('returns "notEnabled" (distinct from "unchanged") and logs nothing when context.enabled is not explicitly true', () => {
      const data = { appointments: { X000001: { user: { name: 'Joe Bloggs' } } } }

      const noContext = logSessionCacheChange('testSource', data, ['appointments', 'X000001', 'user', 'name'], null)
      const disabledContext = logSessionCacheChange(
        'testSource',
        data,
        ['appointments', 'X000001', 'user', 'name'],
        null,
        { enabled: false },
      )

      expect(noContext).toEqual('notEnabled')
      expect(disabledContext).toEqual('notEnabled')
      expect(mockedLogger.info).not.toHaveBeenCalled()
      expect(mockedLogger.debug).not.toHaveBeenCalled()
    })
  })

  describe('logFieldPresence', () => {
    it('logs at debug level with an empty missing list when every field is present', () => {
      const presence = logFieldPresence(
        'testSource',
        { type: 'C084', date: '2024-04-10' },
        { uuid: 'uuid-1', enabled: true },
      )

      expect(presence).toEqual({ typePresent: true, datePresent: true })
      expect(mockedLogger.debug).toHaveBeenCalledTimes(1)
      expect(mockedLogger.info).not.toHaveBeenCalled()
      const [fields, message] = mockedLogger.debug.mock.calls[0]
      expect(fields).toMatchObject({ event: 'sessionCachePresence', source: 'testSource', missing: [] })
      expect(message).toEqual('[sessionCachePresence] missing=[]')
    })

    it('logs at info level naming only the missing fields', () => {
      const presence = logFieldPresence(
        'testSource',
        { type: 'C084', date: undefined, start: null },
        { uuid: 'uuid-1', enabled: true },
      )

      expect(presence).toEqual({ typePresent: true, datePresent: false, startPresent: false })
      expect(mockedLogger.info).toHaveBeenCalledTimes(1)
      expect(mockedLogger.debug).not.toHaveBeenCalled()
      const [fields, message] = mockedLogger.info.mock.calls[0]
      expect(fields).toMatchObject({ missing: ['date', 'start'] })
      expect(message).toEqual('[sessionCachePresence] missing=[date,start]')
    })

    it('does not log anything and returns an empty presence object when context.enabled is not explicitly true', () => {
      const presence = logFieldPresence('testSource', { type: 'C084', date: undefined }, { uuid: 'uuid-1' })

      expect(presence).toEqual({})
      expect(mockedLogger.info).not.toHaveBeenCalled()
      expect(mockedLogger.debug).not.toHaveBeenCalled()
    })
  })
})
