import { RiskScore } from '../data/model/risk'

export const getRisksWithScore = (risk: Partial<Record<RiskScore, string[]>>, score: RiskScore): string[] => {
  const risks: string[] = []
  if (risk[score]) {
    return risk[score]
  }
  return risks
}
