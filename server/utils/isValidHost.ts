export const isValidHost = (host: string): boolean => {
  const validHosts = [
    process.env.HMPPS_AUTH_URL,
    process.env.MANAGE_USERS_API_URL,
    process.env.TOKEN_VERIFICATION_API_URL,
    process.env.MAS_API_URL,
    process.env.ARNS_API_URL,
    process.env.TIER_API_URL,
    process.env.FLIPT_URL,
    process.env.INTERVENTIONS_API_URL,
    process.env.SENTENCE_PLAN_API_URL,
    'http://localhost:8100',
    'http://localhost:9091',
    'http://localhost:8080/api',
    'http://localhost:9090/auth',
  ].filter(Boolean)
  return validHosts.includes(host)
}
