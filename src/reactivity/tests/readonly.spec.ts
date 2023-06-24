import { isReactive, isReadonly, readonly,isProxy } from "../reactive";

describe('readonly',() => {
    it("happy path",() => {

        // not set
        const original = { foo:1,bar:{baz:2} }
        const wrapped = readonly(original)
        expect(wrapped).not.toBe(original)
        expect(wrapped.foo).toBe(1)
        expect(isReactive(wrapped)).toBe(false)
        expect(isReadonly(wrapped)).toBe(true)
        expect(isReadonly(original)).toBe(false)
        expect(isReadonly(wrapped.bar)).toBe(true)
        expect(isReadonly(original.bar)).toBe(false)
        expect(isProxy(wrapped)).toBe(true)
    })

    it('warn when call set',()=>{

        console.warn = jest.fn()

        const user = readonly({
            age:1
        })
        user.age = 2

        expect(console.warn).toBeCalled()
    })
})