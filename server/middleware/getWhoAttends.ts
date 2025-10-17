import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { Provider, Team, User } from '../data/model/caseload'
import { getDataValue, setDataValue } from '../utils'

export const getWhoAttends = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { username } = res.locals.user
    const { crn, id } = req.params
    const { providerCode, teamCode, back } = req.query as Record<string, string>
    const token = await hmppsAuthClient.getSystemClientToken(username)
    const masClient = new MasApiClient(token)
    const { data } = req.session

    let selectedRegion: string
    let selectedTeam: string

    if (!providerCode || back) {
      selectedRegion = getDataValue(data, ['appointments', crn, id, 'user', 'providerCode'])
      selectedTeam = getDataValue(data, ['appointments', crn, id, 'user', 'teamCode'])
    } else {
      selectedRegion = providerCode
      selectedTeam = teamCode
    }

    const { defaultUserDetails, providers, teams, users } = await masClient.getUserProviders(
      username,
      selectedRegion,
      selectedTeam,
    )

    let displayedProviders: Provider[]
    let displayedTeams: Team[]
    let displayedUsers: User[]

    if (req.method === 'GET') {
      if (selectedRegion || back) {
        displayedProviders = providers.map(p => {
          if (p.code === selectedRegion) {
            return { code: p.code, name: p.name, selected: 'selected' }
          }
          return { code: p.code, name: p.name }
        })
        displayedTeams = teams.map(t => {
          if (t.code === selectedTeam) {
            return { description: t.description, code: t.code, selected: 'selected' }
          }
          return { description: t.description, code: t.code }
        })
        displayedUsers = users
      } else {
        displayedProviders = providers.map(p => {
          if (p.name === defaultUserDetails.homeArea) {
            setDataValue(data, ['appointments', crn, id, 'user', 'providerCode'], p.code)
            return { code: p.code, name: p.name, selected: 'selected' }
          }
          return { code: p.code, name: p.name }
        })

        displayedTeams = teams.map(t => {
          if (t.description === defaultUserDetails.team) {
            setDataValue(data, ['appointments', crn, id, 'user', 'teamCode'], t.code)
            return { description: t.description, code: t.code, selected: 'selected' }
          }
          return { description: t.description, code: t.code }
        })

        displayedUsers = users.map(u => {
          if (u.username.toUpperCase() === defaultUserDetails.username) {
            setDataValue(data, ['appointments', crn, id, 'user', 'username'], u.username)
            return { username: u.username, nameAndRole: u.nameAndRole, selected: 'selected' }
          }
          return { username: u.username, nameAndRole: u.nameAndRole }
        })
      }

      req.session.data = {
        ...(req?.session?.data ?? {}),
        providers: {
          ...(req?.session?.data?.providers ?? {}),
          [username]: displayedProviders,
        },
        teams: {
          ...(req?.session?.data?.teams ?? {}),
          [username]: displayedTeams,
        },
        staff: {
          ...(req?.session?.data?.staff ?? {}),
          [username]: displayedUsers,
        },
      }
    } else {
      displayedProviders = req.session.data.providers[username]
      displayedTeams = req.session.data.teams[username]
      displayedUsers = req.session.data.staff[username]
    }

    res.locals.userProviders = displayedProviders
    res.locals.userTeams = displayedTeams
    res.locals.userStaff = displayedUsers
    res.locals.defaultUser = defaultUserDetails
    res.locals.providerCode = providerCode ?? ''
    res.locals.teamCode = teamCode ?? ''
    return next()
  }
}
