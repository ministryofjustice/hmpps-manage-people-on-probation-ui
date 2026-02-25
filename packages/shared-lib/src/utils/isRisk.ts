import { Need, RiskFlag } from '../data/model/risk'

export const isRisk = (data: Need[] | RiskFlag[]): data is Need[] => {
  return (data as Need[])[0]?.severity !== undefined
}
