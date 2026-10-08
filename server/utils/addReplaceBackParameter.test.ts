import { addReplaceBackParameter } from './addReplaceBackParameter'

describe('utils/addReplaceBackParameter', () => {
  it('should replace backParam if it exists', () => {
    expect(addReplaceBackParameter('url?back=old', 'back=new')).toEqual('url?back=new')
  })
  it('should add backParam if no params', () => {
    expect(addReplaceBackParameter('url', 'back=new')).toEqual('url?back=new')
  })
  it('should add backParam to other params if they exist', () => {
    expect(addReplaceBackParameter('url?param1=one', 'back=new')).toEqual('url?param1=one&back=new')
  })
})
