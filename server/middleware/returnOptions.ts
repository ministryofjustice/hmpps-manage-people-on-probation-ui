import { Request, Response, NextFunction } from 'express'
import { getDataValue } from '../utils'

export const returnOptions = (req: Request, res: Response, _next: NextFunction) => {
  const { username } = res.locals.user
  const { data } = req.session
  const response = {
    providers: getDataValue(data, ['providers', 'temp', username]),
    teams: getDataValue(data, ['teams', 'temp', username]),
    users: getDataValue(data, ['staff', 'temp', username]),
  }
  return res.json(response)
}
