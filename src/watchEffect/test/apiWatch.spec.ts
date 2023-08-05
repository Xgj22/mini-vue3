import { reactive } from "../../reactivity/reactive"
import { nextTick } from "../../runtime-core"
import { watchEffect } from "../../runtime-core/apiWatch"


describe("api:watch",() => {

    it("effect",async () =>{
        const state = reactive({ count:0 })
        let dummy
        watchEffect( () => {
            dummy = state.count
        })
        expect(dummy).toBe(0)

        state.count++
        await nextTick();
        expect(dummy).toBe(1)
    })

    it("stopping the watcher(effect)",async () =>{
        const state = reactive({count: 0})
        let dummy
        const stop:any = watchEffect(() => {
            dummy = state.count
        })

        expect(dummy).toBe(0)
        stop()
        state.count++
        await nextTick()
        expect(dummy).toBe(0)
    })

    it("cleanup registration (effect)",async () =>{
        const state = reactive({ count:0})
        const cleanup = jest.fn()
        let dummy 
        const stop:any = watchEffect((onCleanup) => {
            onCleanup(cleanup)
            dummy = state.count
        })
        expect(dummy).toBe(0)

        state.count++
        await nextTick()
        expect(cleanup).toHaveBeenCalledTimes(1)
          
        stop()
        expect(cleanup).toHaveBeenCalledTimes(2)
    })
})