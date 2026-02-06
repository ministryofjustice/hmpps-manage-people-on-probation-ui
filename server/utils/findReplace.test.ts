import { findReplace } from './findReplace'
import { setDataValue } from '.'

const mockData = {
  personSummary: {
    name: {
      forename: 'Caroline',
      middleName: 'Linda',
      surname: 'Wolff',
    },
  },
  riskFlags: [
    {
      id: 1,
      description: 'Very High RoSH',
      level: 'HIGH',
    },
    {
      id: 2,
      description: 'Very High RoSH',
      level: 'MEDIUM',
    },
  ],
  removedRiskFlags: [
    {
      id: 4,
      description: 'Restraining Order',
    },
    {
      id: 5,
      description: 'Very High RoSH',
    },
  ],
}

jest.mock('.', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    setDataValue: jest.fn(),
  }
})

const mockSetDataValue = setDataValue as jest.MockedFunction<typeof setDataValue>

describe('utils/findReplace', () => {
  it('should not replace if term is not found', () => {
    const value = findReplace<any, any>({
      data: mockData,
      path: ['doesntExist'],
      key: 'description',
      find: 'RoSH',
      replace: 'ROSH',
    })
    expect(value).toEqual(mockData)
    expect(mockSetDataValue).not.toHaveBeenCalled()
  })
  it('should replace all property values of array', () => {
    const expected = {
      ...mockData,
      riskFlags: [
        { ...mockData.riskFlags[0], description: 'Very High ROSH' },
        { ...mockData.riskFlags[1], description: 'Very High ROSH' },
      ],
    }
    expect(
      findReplace<any, any>({
        data: mockData,
        path: ['riskFlags'],
        key: 'description',
        find: 'RoSH',
        replace: 'ROSH',
      }),
    ).toEqual(expected)
  })

  it('should replace the term in a string', () => {
    const expected = {
      ...mockData,
      personSummary: {
        ...mockData.personSummary,
        name: {
          ...mockData.personSummary.name,
          forename: 'Andrea',
        },
      },
    }
    expect(
      findReplace<any, any>({
        data: mockData,
        path: ['personSummary', 'name', 'forename'],
        find: 'Caroline',
        replace: 'Andrea',
      }),
    ).toEqual(expected)
  })
})
