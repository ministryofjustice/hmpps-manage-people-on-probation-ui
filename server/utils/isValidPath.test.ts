import { isValidPath } from './isValidPath'

describe('utils/isValidPath', () => {
  it('should return true if path is valid format', () => {
    expect(isValidPath('folder/')).toBe(true)
    expect(isValidPath('user.name/')).toBe(true)
    expect(isValidPath('folder')).toBe(true)
    expect(isValidPath('sentence/X000001?activeSentence=true&number=1')).toBe(true)
    expect(isValidPath('/sentence/X000001?activeSentence=true&number=1')).toBe(true)
    expect(isValidPath('/user.name/X000001?activeSentence=true&number=1')).toBe(true)
    expect(isValidPath('dir/subdir/')).toBe(true)
    expect(isValidPath('dir/user.name/')).toBe(true)
    expect(isValidPath('/dir/subdir')).toBe(true)
    expect(isValidPath('/dir/user.name-name')).toBe(true)
    expect(isValidPath('A/B/C/')).toBe(true)
    expect(isValidPath('A/USER.NAME/C/')).toBe(true)
    expect(isValidPath('abc/DEF/ghi/')).toBe(true)
    expect(isValidPath('abc/USER.NAME/ghi/')).toBe(true)
    expect(isValidPath('/abc/DEF/ghi/')).toBe(true)
    expect(isValidPath('/abc/USER.NAME/ghi/')).toBe(true)
    expect(isValidPath('/user/USER1/access/X000001')).toBe(true)
    expect(isValidPath('/user/USER.NAME-NAME/access/X000001')).toBe(true)
  })
  it('should return false if path is invalid format', () => {
    expect(isValidPath('http://malicious-host/user/USER1/access/X000001')).toBe(false)
  })
})
