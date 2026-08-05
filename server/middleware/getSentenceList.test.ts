import httpMocks from 'node-mocks-http'
import { Sentence } from '../data/model/sentenceDetails'
import { AppResponse } from '../models/Locals'
import { mockAppResponse } from '../controllers/mocks'
import { getSentenceList } from './getSentenceList'

const sentences: Sentence[] = [
  {
    id: 2501085207,
    eventNumber: '1234',
    order: {
      description: 'Adult Custody < 12m (3 Months)',
      sentenceType: 'CUSTODY',
      startDate: '2024-06-04',
      endDate: '2025-09-02',
      pss: true,
    },
    nsis: [],
    licenceConditions: [],
    requirements: [],
  },
  {
    id: 2501085208,
    eventNumber: '5678',
    order: {
      description: 'Pre Sentence',
      sentenceType: 'PRE_SENTENCE',
      startDate: '2024-06-04',
      endDate: '2025-09-02',
      pss: true,
    },
    nsis: [],
    licenceConditions: [],
    requirements: [],
  },
]

const buildResponse = ({ enablePreSentence = true }: { enablePreSentence?: boolean } = {}): AppResponse => {
  const locals = {
    sentences,
    flags: {
      enablePreSentence,
    },
  }
  return mockAppResponse(locals)
}

const nextSpy = jest.fn()

describe('middleware/getSentenceList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('should assign unfiltered sentences to res.locals.sentenceList when enablePreSentence flag is undefined', async () => {
    const req = httpMocks.createRequest()
    const res = mockAppResponse({ sentences: undefined })
    await getSentenceList(req, res, nextSpy)
    expect(res.locals.sentenceList).toEqual([])
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should assign unfilteredsentences to res.locals.sentenceList when enablePreSentence flag is undefined', async () => {
    const req = httpMocks.createRequest()
    const res = mockAppResponse({ sentences, flags: { enablePreSentence: undefined } })
    await getSentenceList(req, res, nextSpy)
    expect(res.locals.sentenceList).toEqual(sentences)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should not filter out PRE_SENTENCE sentences when enablePreSentence flag is true', async () => {
    const req = httpMocks.createRequest()
    const res = buildResponse()
    await getSentenceList(req, res, nextSpy)
    expect(res.locals.sentenceList).toHaveLength(2)
    expect(res.locals.sentenceList).toEqual(sentences)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should filter out PRE_SENTENCE sentences when enablePreSentence flag is false', async () => {
    const req = httpMocks.createRequest()
    const res = buildResponse({ enablePreSentence: false })
    await getSentenceList(req, res, nextSpy)
    expect(res.locals.sentenceList).toHaveLength(1)
    expect(res.locals.sentenceList).toEqual([sentences[0]])
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
})
