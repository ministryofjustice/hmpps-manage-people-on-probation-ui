import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { Provider, Team, User } from '../data/model/caseload'
import { getDataValue, setDataValue } from '../utils'

export const getWhoAttends = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { username } = res.locals.user
    const { crn, id } = req.params
    const { providerCode, teamCode, user } = req.query as Record<string, string>
    const token = await hmppsAuthClient.getSystemClientToken(username)
    const masClient = new MasApiClient(token)
    const { data } = req.session

    let selectedRegion: string
    let selectedTeam: string
    let selectedUser: string

    if (providerCode) {
      selectedRegion = providerCode
      if (teamCode) {
        selectedTeam = teamCode
        if (user) {
          selectedUser = user
        }
      }
    } else {
      selectedRegion = getDataValue(data, ['appointments', crn, id, 'temp', 'providerCode'])
      selectedTeam = getDataValue(data, ['appointments', crn, id, 'temp', 'teamCode'])
      selectedUser = getDataValue(data, ['appointments', crn, id, 'temp', 'username'])
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
    if (req.method === 'GET') {
      // if (selectedRegion || back) {
      displayedProviders = providers.map(p => {
        if (
          (selectedRegion && p.code === selectedRegion) ||
          (!selectedRegion && p.name === defaultUserDetails.homeArea)
        ) {
          setDataValue(data, ['appointments', crn, id, 'temp', 'providerCode'], p.code)
          return { code: p.code, name: p.name, selected: 'selected' }
        }
        return { code: p.code, name: p.name }
      })
      displayedTeams = teams.map(t => {
        if ((selectedTeam && t.code === selectedTeam) || (!selectedTeam && t.description === defaultUserDetails.team)) {
          setDataValue(data, ['appointments', crn, id, 'temp', 'teamCode'], t.code)
          return { description: t.description, code: t.code, selected: 'selected' }
        }
        return { description: t.description, code: t.code }
      })
      displayedUsers = users.map(u => {
        if (
          (selectedUser && u.username === selectedUser) ||
          (!selectedUser && u.username.toUpperCase() === defaultUserDetails.username)
        ) {
          setDataValue(data, ['appointments', crn, id, 'temp', 'username'], u.username)
          return { username: u.username, nameAndRole: u.nameAndRole, selected: 'selected' }
        }
        return { username: u.username, nameAndRole: u.nameAndRole }
      })

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
    return next()
  }
}
