import { ReactiveEffect } from "../reactivity/effect"
import { queuePreFlushCbs } from "./scheduler"


export function watchEffect(source){
    console.log(source)
    function job(){
        effect.run()
    }

    let cleanup
    const onCleanup = function(fn){
        cleanup = effect.onStop = () =>{
            fn()
        }
    }

    function getter(){
        if(cleanup){
            cleanup()
        }

        source(onCleanup)
    }   

    const effect = new ReactiveEffect(getter,() =>{
        queuePreFlushCbs(job)
    })

    effect.run()

    return () => {
        effect.stop()
    }
}