import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'

export const getUserProviders = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { appointment } = res.locals.personAppointment
    const { username } = res.locals.user // this setup may differ based on where called
    const { providerCode, teamCode } = appointment.location
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const { defaultUserDetails, providers, teams, users } = await masClient.getUserProviders(
      username,
      providerCode,
      teamCode,
    )
    const displayedUsers = users.map(u => {
      if (u.username.toUpperCase() === defaultUserDetails.username) {
        return { username: u.username, nameAndRole: u.nameAndRole, selected: 'selected' }
      }
      return { username: u.username, nameAndRole: u.nameAndRole }
    })
    req.session.data = {
      ...(req?.session?.data ?? {}),
      providers: {
        ...(req?.session?.data?.providers ?? {}),
        [username]: providers,
      },
      teams: {
        ...(req?.session?.data?.teams ?? {}),
        [username]: teams,
      },
      staff: {
        ...(req?.session?.data?.staff ?? {}),
        [username]: displayedUsers,
      },
    }
    return next()
  }
}
