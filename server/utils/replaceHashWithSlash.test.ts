import { replaceHashWithSlash } from './replaceHashWithSlash'

describe('replaceHashWithSlash', () => {
  it('replaces double-quoted href="#" with href="/"', () => {
    const input = '<a href="#">Home</a>'
    const output = replaceHashWithSlash(input)
    expect(output).toBe('<a href="/">Home</a>')
  })

  it("replaces single-quoted href='#' with href='/'", () => {
    const input = "<a href='#'>SignIn</a>"
    const output = replaceHashWithSlash(input)
    expect(output).toBe("<a href='/'>SignIn</a>")
  })

  it('replaces multiple occurrences within the same string', () => {
    const input = '<nav><a href="#">One</a><a href="#">Two</a><a href="#">Three</a></nav>'
    const output = replaceHashWithSlash(input)
    expect(output).toBe('<nav><a href="/">One</a><a href="/">Two</a><a href="/">Three</a></nav>')
  })

  it('does not change when href already points to a path', () => {
    const input = '<a href="/path#test">Go</a>'
    const output = replaceHashWithSlash(input)
    expect(output).toBe(input)
  })

  it('returns the same value for empty string', () => {
    const input = ''
    const output = replaceHashWithSlash(input)
    expect(output).toBe('')
  })
})
