import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { Provider, Team, User } from '../data/model/caseload'
import { convertToTitleCase, getDataValue, setDataValue } from '../utils'

export const getUserOptionsV2 = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async function getUserOptionsV2Inner(req, res, next?) {
    const { username } = res.locals.user
    const { crn, id } = req.params as Record<string, string>
    const { providerCode: providerCodeQuery, teamCode: teamCodeQuery } = req.query as Record<string, string>
    const token = await hmppsAuthClient.getSystemClientToken(username)
    const masClient = new MasApiClient(token)
    const { data } = req.session

    // eslint-disable-next-line no-useless-escape
    const regexIgnoreValuesInParentheses = /[\(\)]/

    const providerCode =
      providerCodeQuery || getDataValue(data, ['appointments', crn, id, 'user', 'providerCode']) || ''
    const teamCode =
      teamCodeQuery || !providerCodeQuery ? getDataValue(data, ['appointments', crn, id, 'user', 'teamCode']) || '' : ''
    const usernameSession =
      !providerCodeQuery && !teamCodeQuery
        ? getDataValue(data, ['appointments', crn, id, 'user', 'username']) || ''
        : ''

    const { defaultUserDetails, providers, teams, users } = await masClient.getUserProviders(
      username,
      providerCode,
      teamCode,
    )

    let providerOptions = providers.map(({ code, name }) => {
      const option: Provider = { code, name }
      if (providerCode !== '') {
        if (code === providerCode) {
          option.selected = 'selected'
        }
      } else if (name === defaultUserDetails?.homeArea) {
        option.selected = 'selected'
      }
      return option
    })
    providerOptions = providerOptions.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))

    let teamOptions = teams.map(({ code, description }) => {
      const option: Team = { code, description }
      if (teamCode !== '') {
        if (code === teamCode) {
          option.selected = 'selected'
        }
      } else if (description === defaultUserDetails?.team) {
        option.selected = 'selected'
      }
      return option
    })
    teamOptions = teamOptions.sort((a, b) =>
      a.description.localeCompare(b.description, undefined, { sensitivity: 'base' }),
    )

    let userOptions = users.map(user => {
      if (res.locals.flags.enableMAN2344) {
        const { username: staffUsername, nameAndRole, staffCode, email, name } = user
        const option: User = {
          username: staffUsername,
          nameAndRole: convertToTitleCase(nameAndRole, [], regexIgnoreValuesInParentheses),
          staffCode,
          email,
          name,
        }
        return option
      }
      const { username: staffUsername, nameAndRole, staffCode } = user
      const option: User = {
        username: staffUsername,
        nameAndRole: convertToTitleCase(nameAndRole, [], regexIgnoreValuesInParentheses),
        staffCode,
      }
      return option
    })
    userOptions = userOptions.sort((a, b) =>
      a.nameAndRole.localeCompare(b.nameAndRole, undefined, { sensitivity: 'base' }),
    )
    userOptions = userOptions.map(({ nameAndRole, username: staffUsername, ...restUserProps }) => {
      const option: User = { nameAndRole, username: staffUsername, ...restUserProps }
      if (usernameSession !== '') {
        if (nameAndRole === usernameSession) {
          option.selected = 'selected'
        }
      } else if (staffUsername.toLowerCase() === defaultUserDetails?.username.toLowerCase()) {
        option.selected = 'selected'
      }
      return option
    })

    res.locals.userProviders = providerOptions
    res.locals.userTeams = teamOptions
    res.locals.userStaff = userOptions
    res.locals.providerCode = providerCode
    res.locals.teamCode = teamCode
    setDataValue(data, ['providers', 'temp', username], providers)
    setDataValue(data, ['teams', 'temp', username], teams)
    setDataValue(data, ['staff', 'temp', username], users)

    if (!next) {
      return null
    }
    return next()
  }
}

// USE CACHING
