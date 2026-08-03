import { Request, NextFunction } from 'express'
import { AppResponse } from '../models/Locals'

export const getSentenceList = async (req: Request, res: AppResponse, next: NextFunction) => {
  let sentenceList = res?.locals?.sentences || []
  if (res?.locals?.flags?.enablePreSentence !== undefined) {
    if (res.locals?.flags?.enablePreSentence === false) {
      sentenceList = sentenceList.filter(sentence => sentence?.order?.sentenceType !== 'PRE_SENTENCE')
    }
  }
  res.locals.sentenceList = sentenceList
  return next()
}
