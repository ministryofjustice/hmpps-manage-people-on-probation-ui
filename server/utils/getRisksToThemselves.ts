import { Risk, RiskToSelf } from '../data/model/risk'

interface TypeOfRisk {
  key: keyof RiskToSelf
  text: string
}

export const getRisksToThemselves = (riskToSelf: RiskToSelf, type: string): string[] => {
  const risksToThemselves: string[] = []
  if (riskToSelf === undefined) return risksToThemselves
  const typesOfRisk: TypeOfRisk[] = [
    { key: 'suicide', text: 'suicide' },
    { key: 'selfHarm', text: 'self harm' },
    { key: 'custody', text: 'coping in custody' },
    { key: 'hostelSetting', text: 'coping in a hostel setting' },
    { key: 'vulnerability', text: 'a vulnerability' },
  ]

  typesOfRisk.forEach(risk => {
    if (riskToSelf?.[risk.key]?.[type as keyof Risk]) {
      if (riskToSelf?.[risk.key]?.[type as keyof Risk] === 'YES') {
        risksToThemselves.push(risk.text)
      }
    }
  })
  return risksToThemselves
}
