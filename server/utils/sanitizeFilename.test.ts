import { sanitizeFilename } from './sanitizeFilename'

describe('sanitizeFilename', () => {
  it.each([
    {
      input: 'dummyWordDoc UPW Compliance Plan - Hereford - Worcester copy.docx',
      expected: 'dummyWordDoc UPW Compliance Plan - Hereford - Worcester copy.docx',
    },
    {
      input: 'dummyWordDoc UPW Compliance Plan # Hereford & Worcester copy.docx',
      expected: 'dummyWordDoc UPW Compliance Plan - Hereford - Worcester copy.docx',
    },
    {
      input: "file # name'error.docx",
      expected: "file - name'error.docx",
    },
    {
      input: 'file!name$test%file&name#test^file/name\\test"name<test>name;test?name*test.docx',
      expected: 'file-name-test-file-name-test-file-name-test-name-test-name-test-name-test.docx',
    },
  ])('sanitizes "$input"', ({ input, expected }) => {
    expect(sanitizeFilename(input)).toBe(expected)
  })
})
