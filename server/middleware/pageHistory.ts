import { Data } from 'applicationinsights/out/Declarations/Contracts'
import { Route } from '../@types'
import { getDataValue, setDataValue } from '../utils'

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
    for (let i = 0; i < history.length - 2; i += 1) {
      if (history[i] === url) {
        history = history.slice(i + 1, history.length)
      }
    }
    // if a backLink was used
    // (is this neccesarily the case or does this just track a return to a previous page)
    if (history[history.length - 2] === url) {
      history = history.slice(0, history.length - 2)
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
