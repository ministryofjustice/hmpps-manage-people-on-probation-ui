/* eslint-disable no-param-reassign */

import { DateTime } from 'luxon'
import getKeypath from 'lodash/get'
import setKeypath from 'lodash/set'
import { Request } from 'express'
import { Need, RiskScore, RiskSummary, RiskToSelf } from '../data/arnsApiClient'
import { ErrorSummary, Name } from '../data/model/common'
import config from '../config'
import { CaseSearchFilter, SelectElement } from '../data/model/caseload'
import { RecentlyViewedCase, UserAccess } from '../data/model/caseAccess'
import { RiskFlag, RiskScoresDto, RoshRiskWidgetDto, TimelineItem } from '../data/model/risk'
import type { AppResponse } from '../@types'
import { Contact } from '../data/model/professionalContact'
import { toDate, dateWithYearShortMonthAndTime } from '.'

interface Item {
  checked?: string
  selected?: string
  value: string
  text?: string
  idPrefix?: string
}

export const setSortOrder = (columnName: string, sortBy: string) => {
  const colName = sortBy.split('.')[0]
  const sortOrder = sortBy.split('.')[1]
  if (colName === columnName) {
    if (sortOrder === 'desc') {
      return 'descending'
    }
    return 'ascending'
  }
  return 'none'
}
export const defaultFormInputValues = (
  object: HTMLInputElement,
  data: CaseSearchFilter,
  id: string,
): HTMLInputElement => {
  const obj = object
  if (data !== undefined) {
    obj.id = id
    obj.name = id
    obj.value = data[id]
  }
  return obj
}

export const defaultFormSelectValues = (object: SelectElement, data: CaseSearchFilter, id: string): SelectElement => {
  const obj = object
  if (data !== undefined) {
    obj.id = id
    obj.name = id

    obj.items.forEach(item => {
      if (item.value === data[id]) {
        item.selected = 'selected'
      }
    })
  }
  return obj
}

export const checkRecentlyViewedAccess = (
  recentlyViewed: RecentlyViewedCase[],
  userAccess: UserAccess,
): RecentlyViewedCase[] => {
  return recentlyViewed.map(rv => {
    const ua = userAccess?.access?.find(u => u.crn === rv.crn)
    return { ...rv, limitedAccess: ua?.userExcluded === true || ua?.userRestricted === true }
  })
}

export const isDefined = (val: unknown) => typeof val !== 'undefined'

export const isNotNull = (val: unknown) => {
  return val !== null
}

export const hasValue = (val: unknown) => {
  return isNotNull(val) && isDefined(val)
}

export const makePageTitle = ({ pageHeading }: { pageHeading: string | string[] }): string => {
  const titles = !Array.isArray(pageHeading) ? [pageHeading] : pageHeading
  return `${titles.join(' - ')} - ${config.applicationName}`
}

export const getDataValue = (data: any, sections: any) => {
  const path = Array.isArray(sections) ? sections : [sections]
  return getKeypath(data, path.map((s: any) => `["${s}"]`).join(''))
}

export const setDataValue = (data: any, sections: any, value: any) => {
  const path = Array.isArray(sections) ? sections : [sections]
  return setKeypath(data, path.map((s: any) => `["${s}"]`).join(''), value)
}

export const decorateFormAttributes = (req: Request, res: AppResponse) => (obj: any, sections?: string[]) => {
  const newObj = obj
  const { data } = req.session as any
  let storedValue = getDataValue(data, sections)
  if (storedValue && config.dateFields.includes(sections[sections.length - 1]) && storedValue.includes('-')) {
    const [year, month, day] = storedValue.split('-')
    storedValue = [day.padStart(2, '0'), month.padStart(2, '0'), year].join('/')
  }
  if (newObj.items !== undefined) {
    newObj.items = newObj.items.map((item: Item) => {
      if (typeof item.value === 'undefined') {
        item.value = item.text
      }
      if (storedValue) {
        if ((Array.isArray(storedValue) && storedValue.includes(item.value)) || storedValue === item.value) {
          if (storedValue.indexOf(item.value) !== -1) {
            item.checked = 'checked'
            item.selected = 'selected'
          }
        }
      }
      return item
    })
    if (sections?.length) {
      newObj.idPrefix = sections.join('-')
    }
  } else {
    newObj.value = storedValue
  }
  if (sections?.length) {
    const id = sections.join('-')
    if (typeof newObj.id === 'undefined') {
      newObj.id = id
    }
    newObj.name = sections.map((s: string) => `[${s}]`).join('')
    if (res?.locals?.errors?.errorMessages?.[id]?.text) {
      newObj.errorMessage = { text: res.locals.errors.errorMessages[id].text }
    }
  }
  return newObj
}

export const toTimeline = (riskScores: RiskScoresDto[]): TimelineItem[] => {
  const sorted = [...riskScores].sort((a, b) => +toDate(b.completedDate) - +toDate(a.completedDate))
  return sorted.map(riskScore => {
    const scores = {
      RSR: {
        type: 'RSR',
        level: riskScore.riskOfSeriousRecidivismScore?.scoreLevel,
        score: riskScore.riskOfSeriousRecidivismScore?.percentageScore,
      },
      OGP: {
        type: 'OGP',
        level: riskScore.generalPredictorScore?.ogpRisk,
        oneYear: riskScore.generalPredictorScore?.ogp1Year,
        twoYears: riskScore.generalPredictorScore?.ogp2Year,
      },
      OSPC: {
        type: 'OSP/C',
        level:
          riskScore.sexualPredictorScore?.ospContactScoreLevel ||
          riskScore.sexualPredictorScore?.ospDirectContactScoreLevel,
        score:
          riskScore.sexualPredictorScore?.ospContactPercentageScore ||
          riskScore.sexualPredictorScore?.ospDirectContactPercentageScore,
      },
      OSPI: {
        type: 'OSP/I',
        level:
          riskScore.sexualPredictorScore?.ospIndecentScoreLevel ||
          riskScore.sexualPredictorScore?.ospIndirectImageScoreLevel,
        score:
          riskScore.sexualPredictorScore?.ospIndecentPercentageScore ||
          riskScore.sexualPredictorScore?.ospIndirectImagePercentageScore,
      },
      OGRS: {
        type: 'OGRS',
        level: riskScore.groupReconvictionScore?.scoreLevel,
        oneYear: riskScore.groupReconvictionScore?.oneYear,
        twoYears: riskScore.groupReconvictionScore?.twoYears,
      },
      OVP: {
        type: 'OVP',
        level: riskScore.violencePredictorScore?.ovpRisk,
        oneYear: riskScore.violencePredictorScore?.oneYear,
        twoYears: riskScore.violencePredictorScore?.twoYears,
      },
    }
    return { date: dateWithYearShortMonthAndTime(riskScore.completedDate), scores }
  })
}

export const riskLevelLabel = (level: string) => {
  switch (level) {
    case 'VERY_HIGH':
      return 'Very high'
    case 'HIGH':
      return 'High'
    case 'MEDIUM':
      return 'Medium'
    case 'LOW':
      return 'Low'
    default:
      return level
  }
}

const isRisk = (data: Need[] | RiskFlag[]): data is Need[] => {
  return (data as Need[])[0]?.severity !== undefined
}

export const groupByLevel = (level: string, data: Need[] | RiskFlag[]) => {
  if (!data) {
    return []
  }
  if (isRisk(data)) {
    return data.filter(item => item?.severity === level)
  }
  return data.filter(item => item.level === level)
}

export const toErrorList = (errors: Record<string, string>) => {
  return Object.entries(errors).map(error => {
    return {
      text: error[1],
      href: `#${error[0]}`,
    }
  })
}

export const toSentenceCase = (value: string | null | undefined): string => {
  if (!value) return ''
  const val = value.split('_').join(' ').split('-').join(' ')
  return `${val.charAt(0).toUpperCase()}${val.substring(1).toLowerCase()}`
}

function toMap(partial: Partial<Record<RiskScore, string[]>>): { [key: string]: string } {
  const x: { [key: string]: string } = {}
  Object.entries(partial).forEach(item => {
    item[1].forEach(v => {
      // eslint-disable-next-line prefer-destructuring
      x[v] = item[0]
    })
  })
  return x
}

export const toRoshWidget = (roshSummary: RiskSummary): RoshRiskWidgetDto => {
  if (!roshSummary) {
    return { overallRisk: 'NOT_FOUND', assessedOn: undefined, riskInCommunity: undefined, riskInCustody: undefined }
  }

  if (!roshSummary.summary) {
    return { overallRisk: 'UNAVAILABLE', assessedOn: undefined, riskInCommunity: undefined, riskInCustody: undefined }
  }

  const riskInCommunity = toMap(roshSummary.summary.riskInCommunity)
  const riskInCustody = toMap(roshSummary.summary.riskInCustody)
  return {
    overallRisk: roshSummary.summary.overallRiskLevel,
    assessedOn: roshSummary.assessedOn,
    riskInCommunity,
    riskInCustody,
  }
}

export const toCamelCase = (str: string): string => {
  return str
    .replace('-', ' ')
    .split(' ')
    .map((word, i) => {
      return i > 0 ? `${word.slice(0, 1).toUpperCase()}${word.slice(1).toLowerCase()}` : word.toLowerCase()
    })
    .join('')
}

export const toPredictors = (predictors: RiskScoresDto[] | ErrorSummary | null): TimelineItem => {
  let timeline: TimelineItem[] = []
  let predictorScores
  if (Array.isArray(predictors)) {
    timeline = toTimeline(predictors)
  }
  if (timeline.length > 0) {
    ;[predictorScores] = timeline
  }

  return predictorScores
}

export const roleDescription = (contact: Contact, addBreak?: boolean): string => {
  const breakTag = addBreak ? '<br>' : ' '
  const responsibleOfficer = contact.responsibleOfficer ? `${breakTag}(responsible officer)` : ''
  return contact.prisonOffenderManager
    ? `Prison Offender Manager (POM)${responsibleOfficer}`
    : `Community Offender Manager (COM)${responsibleOfficer}`
}

export const toSentenceDescription = (value?: string): string => (!value ? 'Pre-Sentence' : value)

export const shortTime = (isoTime: string) => {
  const time = DateTime.fromISO(isoTime)
  return (time.minute.valueOf() > 0 ? time.toFormat('h:mma') : time.toFormat('ha')).toLocaleLowerCase()
}

export const concat = (arr: string[], value: string) => {
  if (!Array.isArray(arr)) {
    throw new Error('First argument must be an array')
  }
  return arr.concat(value)
}

export const getSearchParamsString = ({
  req,
  ignore = [],
  prefix = '?',
  showPrefixIfNoQuery = false,
  suffix = '',
}: {
  req: Request
  ignore?: string[]
  prefix?: string
  showPrefixIfNoQuery?: boolean
  suffix?: string
}): string => {
  const query = req.query as Record<string, string>
  if (!Object.keys(query).length) {
    return showPrefixIfNoQuery ? `${prefix}` : ''
  }
  const params = Object.entries(query).filter(([key, value]) => !ignore.includes(key) && value)
  if (!params.length) {
    return showPrefixIfNoQuery ? `${prefix}` : ''
  }
  const searchParams = params
    .reduce((acc, [key, value]) => {
      return [...acc, `${key}=${value}`]
    }, [])
    .join('&')
  return `${prefix}${searchParams}${suffix}`
}
