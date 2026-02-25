import { RiskSummary } from '../../data/model/risk'

export const roshSummary = {
  riskToSelf: {
    suicide: {
      risk: 'YES',
      previous: 'DK',
      current: 'YES',
      currentConcernsText: 'Meaningful content for AssSumm Testing - R8.1.1',
    },
    selfHarm: {
      risk: 'YES',
      previous: 'YES',
      previousConcernsText: 'Meaningful content for AssSumm Testing - r814 ',
      current: 'YES',
      currentConcernsText: 'Meaningful content for AssSumm Testing - R8.1.1',
    },
    custody: {
      risk: 'YES',
      previous: 'DK',
      current: 'YES',
      currentConcernsText: 'Meaningful content for AssSumm Testing -  r821',
    },
    hostelSetting: {
      risk: 'YES',
      previous: 'YES',
      previousConcernsText: 'Meaningful content for AssSumm Testing -  R822',
      current: 'NO',
    },
    vulnerability: {
      risk: 'YES',
      previous: 'NO',
      current: 'YES',
      currentConcernsText: 'Meaningful content for AssSumm Testing -  r831',
    },
  },
  otherRisks: {
    escapeOrAbscond: 'YES',
    controlIssuesDisruptiveBehaviour: 'YES',
    breachOfTrust: 'YES',
    riskToOtherPrisoners: 'YES',
  },
  summary: {
    whoIsAtRisk: 'NOD-849Meaningful content for AssSumm Testing -  r10.1',
    natureOfRisk: 'NOD-849 Meaningful content for AssSumm Testing -  r10.2',
    riskImminence: 'NOD-849 R10.3Meaningful content for AssSumm Testing - ',
    riskIncreaseFactors: 'NOD-849Meaningful content for AssSumm Testing -  R10.4',
    riskMitigationFactors: 'NOD-849 Meaningful content for AssSumm Testing -  r10.5',
    riskInCommunity: {
      LOW: ['Children', 'Staff'],
      MEDIUM: ['Known Adult'],
      HIGH: ['Public'],
      VERY_HIGH: ['Prisoners'],
    },
    riskInCustody: {
      LOW: ['Children', 'Public', 'Known Adult', 'Staff', 'Prisoners'],
    },
    overallRiskLevel: 'HIGH',
  },
  assessedOn: '2024-01-24T08:07:15',
} as unknown as RiskSummary
