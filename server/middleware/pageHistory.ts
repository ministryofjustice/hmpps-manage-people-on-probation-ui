import { NextFunction, Request, Response } from 'express'

export const pageHistory = (req: Request, res: Response, _next?: NextFunction) => {
  const { url } = req
  const ignore = ['/sign-in']
  if (!ignore.some(ignoreUrl => url.includes(ignoreUrl))) {
    let history = []
    if (req?.session?.pageHistory) {
      history = req.session.pageHistory
      const index = history.lastIndexOf(url)
      if (index !== -1) {
        history = history.slice(0, index + 1)
      } else {
        history = [...history, url]
      }
    } else {
      history = [url]
    }
    if (req?.query?.back) {
      history = [...history.slice(0, history.length - 2), req.query.back as string, ...history.slice(-1)]
    }
    res.locals.backLink = history?.[history.length - 2] ?? null
    req.session.pageHistory = history
  }
}
