import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { Provider, Team, User } from '../data/model/caseload'
import { convertToTitleCase, getDataValue, setDataValue } from '../utils'

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

    const [{ defaultUserDetails, providers, teams, users }, probationPractitioner] = await Promise.all([
      masClient.getUserProviders(username, selectedRegion, selectedTeam),
      masClient.getProbationPractitioner(crn),
    ])
    let providerOptions = providers
    let teamOptions = teams
    let userOptions = users

    const defaultUser = probationPractitioner?.unallocated
      ? defaultUserDetails
      : {
          username: probationPractitioner?.username,
          homeArea: probationPractitioner.provider.name,
          team: probationPractitioner.team.description,
        }

    if (
      !providers.some(provider => provider.code === probationPractitioner.provider.code) &&
      !probationPractitioner.unallocated
    ) {
      providerOptions = [...providers, probationPractitioner.provider]
    }
    let includePractitionerTeamOption =
      !teams.some(team => team.code === probationPractitioner.team.code) && !probationPractitioner.unallocated
    if (selectedRegion && includePractitionerTeamOption) {
      includePractitionerTeamOption = probationPractitioner.provider.code === selectedRegion
    }
    if (includePractitionerTeamOption) {
      teamOptions = [...teams, probationPractitioner.team]
    }
    let includePractitionerUserOption =
      probationPractitioner?.username &&
      !users.some(user => user.username.toLowerCase() === probationPractitioner.username.toLowerCase())
    if (includePractitionerUserOption && selectedRegion) {
      includePractitionerUserOption = probationPractitioner.provider.code === selectedRegion
    }
    if (includePractitionerUserOption && selectedTeam) {
      includePractitionerUserOption = probationPractitioner.team.code === selectedTeam
    }
    if (includePractitionerUserOption) {
      const {
        username: ppUsername,
        name: { forename, surname },
      } = probationPractitioner
      userOptions = [...users, { username: ppUsername, nameAndRole: `${forename} ${surname} (COM)` }]
    }
    let displayedProviders: Provider[]
    let displayedTeams: Team[]
    let displayedUsers: User[]

    if (req.method === 'GET') {
      if (selectedRegion || back) {
        displayedProviders = providerOptions.map(provider => {
          if (provider.code === selectedRegion) {
            return { code: provider.code, name: provider.name, selected: 'selected' }
          }
          return { code: provider.code, name: provider.name }
        })

        displayedTeams = teamOptions.map(team => {
          if (team.code === selectedTeam) {
            return { description: team.description, code: team.code, selected: 'selected' }
          }
          return { description: team.description, code: team.code }
        })
        displayedUsers = userOptions.map(user => ({
          username: user.username,
          nameAndRole: convertToTitleCase(user.nameAndRole),
        }))
      } else {
        displayedProviders = providerOptions.map(provider => {
          if (provider.name === defaultUser.homeArea) {
            setDataValue(data, ['appointments', crn, id, 'user', 'providerCode'], provider.code)
            return { code: provider.code, name: provider.name, selected: 'selected' }
          }
          return { code: provider.code, name: provider.name }
        })
        if (getDataValue(data, ['appointments', crn, id, 'user', 'providerCode']) === undefined) {
          setDataValue(data, ['appointments', crn, id, 'user', 'providerCode'], displayedProviders[0].code)
        }

        displayedTeams = teamOptions.map(team => {
          if (team.description === defaultUser.team) {
            setDataValue(data, ['appointments', crn, id, 'user', 'teamCode'], team.code)
            return { description: team.description, code: team.code, selected: 'selected' }
          }
          return { description: team.description, code: team.code }
        })
        if (getDataValue(data, ['appointments', crn, id, 'user', 'teamCode']) === undefined) {
          setDataValue(data, ['appointments', crn, id, 'user', 'teamCode'], displayedTeams[0].code)
        }

        displayedUsers = userOptions.map(user => {
          if (user.username.toLowerCase() === defaultUser.username.toLowerCase()) {
            setDataValue(data, ['appointments', crn, id, 'user', 'username'], user.username)
            return { username: user.username, nameAndRole: user.nameAndRole, selected: 'selected' }
          }
          return { username: user.username, nameAndRole: user.nameAndRole }
        })
        if (getDataValue(data, ['appointments', crn, id, 'user', 'username']) === undefined) {
          setDataValue(data, ['appointments', crn, id, 'user', 'username'], displayedUsers[0].username)
        }
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
    res.locals.defaultUser = defaultUser
    res.locals.providerCode = providerCode ?? ''
    res.locals.teamCode = teamCode ?? ''
    return next()
  }
}
