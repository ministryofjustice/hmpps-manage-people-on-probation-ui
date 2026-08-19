import { Request, Response } from 'express'

export const setSearchFilters = () => {
  return async function setSearchFiltersInner(req: Request, res: Response) {
    if (!req.session.probationSearch) req.session.probationSearch = {}
    const session = req.session.probationSearch
    session.matchAllTerms = req.body.matchAllTerms
    session.providers = req.body.providers
    res.sendStatus(200)
  }
}
