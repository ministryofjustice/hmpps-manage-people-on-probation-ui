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
        displayedProviders = providers.map(provider => {
          if (provider.code === selectedRegion) {
            return { code: provider.code, name: provider.name, selected: 'selected' }
          }
          return { code: provider.code, name: provider.name }
        })
        displayedTeams = teams.map(team => {
          if (team.code === selectedTeam) {
            return { description: team.description, code: team.code, selected: 'selected' }
          }
          return { description: team.description, code: team.code }
        })
        displayedUsers = users
      } else {
        displayedProviders = providers.map(provider => {
          if (provider.name === defaultUserDetails.homeArea) {
            setDataValue(data, ['appointments', crn, id, 'user', 'providerCode'], provider.code)
            return { code: provider.code, name: provider.name, selected: 'selected' }
          }
          return { code: provider.code, name: provider.name }
        })

        displayedTeams = teams.map(team => {
          if (team.description === defaultUserDetails.team) {
            setDataValue(data, ['appointments', crn, id, 'user', 'teamCode'], team.code)
            return { description: team.description, code: team.code, selected: 'selected' }
          }
          return { description: team.description, code: team.code }
        })

        displayedUsers = users.map(user => {
          if (user.username.toUpperCase() === defaultUserDetails.username) {
            setDataValue(data, ['appointments', crn, id, 'user', 'username'], user.username)
            return { username: user.username, nameAndRole: user.nameAndRole, selected: 'selected' }
          }
          return { username: user.username, nameAndRole: user.nameAndRole }
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
