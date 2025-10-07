import { Data } from 'applicationinsights/out/Declarations/Contracts'
import { Route } from '../@types'
import { getDataValue, setDataValue } from '../utils'

export const setUpPageHistory = (nested: boolean = false): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { url } = req
    if (!res.locals.pageHistory) {
      res.locals.pageHistory = [url]
    }
    return next()
  }
}

export const pageHistory = (nested: boolean = false): Route<Promise<void>> => {
  return async (req, res, next) => {
    const newSessionData = req?.session?.data ?? {}
    req.session.data = newSessionData
    const { url } = req
    const { data } = req.session
    let history = getDataValue(data, ['pageHistory'])
    if (history === undefined) {
      history = []
    }
    // remove previous history for this page
    for (let i = 0; i < history.length - 1; i += 1) {
      if (history[i] === url) {
        history = history.slice(i + 1, history.length)
      }
    }
    // don't update if no page change
    if (history[history.length - 1] !== url) {
      history.push(url)
    }
    setDataValue(data, ['pageHistory'], history)
    console.log(history)
    return next()
  }
}
