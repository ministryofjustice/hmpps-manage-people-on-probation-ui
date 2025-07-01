import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { Provider, Team, User } from '../data/model/caseload'
import { getDataValue } from '../utils'

export const getWhoAttends = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { username } = res.locals.user
    const { crn, id } = req.params
    const { providerCode, teamCode } = req.query as Record<string, string>
    const token = await hmppsAuthClient.getSystemClientToken(username)
    const masClient = new MasApiClient(token)
    const region = providerCode || req?.session?.data?.appointments?.[crn]?.[id]?.user?.providerCode

    let selectedRegion: string
    let selectedTeam: string

    const { data } = req.session
    selectedRegion = getDataValue(data, ['appointments', crn, id, 'user', 'providerCode'])

    if (selectedRegion) {
      selectedTeam = getDataValue(data, ['appointments', crn, id, 'user', 'teamCode'])
    } else {
      selectedRegion = region
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

    // On page load only username will be provided
    // when drop down is changed in attendance.njk
    // providerCode will be populated and potentially teamCode.
    // When back link is selected from location page, treat this
    // in the same instance as providerCode flow.
    // On page load need to default the drop-down to
    // user default values
    if (providerCode || selectedRegion) {
      displayedProviders = providers
      displayedTeams = teams
      displayedUsers = users
    } else {
      displayedProviders = providers.map(p => {
        if (p.name === defaultUserDetails.homeArea) {
          return { code: p.code, name: p.name, selected: 'selected' }
        }
        return { code: p.code, name: p.name }
      })

      displayedTeams = teams.map(t => {
        if (t.description === defaultUserDetails.team) {
          return { description: t.description, code: t.code, selected: 'selected' }
        }
        return { description: t.description, code: t.code }
      })

      displayedUsers = users.map(u => {
        if (u.username.toUpperCase() === defaultUserDetails.username) {
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

    res.locals.userProviders = displayedProviders
    res.locals.userTeams = displayedTeams
    res.locals.userStaff = displayedUsers

    return next()
  }
}
