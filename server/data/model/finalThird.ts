export interface FinalThirdEligibility {
  eligible: boolean
  since: string
}

export interface CurrentPhaseResponse {
  finalThirdEligibility?: FinalThirdEligibility | null
}
