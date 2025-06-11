import { RiskSummary } from '../../data/model/risk'

export const mockRisks = {
  overallRisk: 'VERY_HIGH',
  assessedOn: '2024-11-29T13:01:15',
  riskInCommunity: {
    Public: 'HIGH',
    Children: 'LOW',
    'Known Adult': 'MEDIUM',
    Staff: 'VERY_HIGH',
  },
  riskInCustody: {
    Public: 'HIGH',
    Children: 'LOW',
    'Known Adult': 'MEDIUM',
    Staff: 'VERY_HIGH',
    Prisoners: 'MEDIUM',
  },
} as unknown as RiskSummary
