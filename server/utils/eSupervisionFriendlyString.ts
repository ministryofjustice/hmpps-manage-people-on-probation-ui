const definitions: Record<string, string> = {
  YES: 'Yes',
  NO: 'No',
  EMAIL: 'Email',
  TEXT: 'Text message',
  PHONE: 'Text message',
  WEEKLY: 'Every week',
  TWO_WEEKS: 'Every 2 weeks',
  FOUR_WEEKS: 'Every 4 weeks',
  EIGHT_WEEKS: 'Every 8 weeks',
  VERY_WELL: 'Very well',
  WELL: 'Well',
  NOT_GREAT: 'Not great',
  STRUGGLING: 'Struggling',
  MENTAL_HEALTH: 'Mental health',
  ALCOHOL: 'Alcohol',
  DRUGS: 'Drugs',
  HOUSING: 'Housing',
  MONEY: 'Money',
  SUPPORT_SYSTEM: 'Support system',
  OTHER: 'Other',
  NO_HELP: 'No, I do not need help',
}

export default function getUserFriendlyString(key: string): string {
  if (!key) {
    return ''
  }
  if (typeof key !== 'string') {
    return key
  }
  return definitions[key.trim().toUpperCase()] ?? key
}
