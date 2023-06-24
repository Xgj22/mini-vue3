export class ReactiveEffect {
    private _fn:any
    scheduler
    deps = []
    active = true
    onStop?:() => void
    constructor(fn,scheduler){
        this._fn = fn
        this.scheduler = scheduler
    }

    run(){
        // 1. 会收集依赖
        // shouldTrack 来做区分
        if(!this.active) {
            return this._fn()
        }

        shouldTrack = true
        activeEffect = this

        const result = this._fn()

        // reset
        shouldTrack = false
        return result
    }
    
    stop(){
        if(this.active) {
            cleanupEffect(this)
            if(this.onStop){
                this.onStop()
            }
            this.active = false
        }
    }
}

function cleanupEffect(effect) {
    // 找到所有依赖这个 effect 的响应式对象
    // 从这些响应式对象里面把 effect 给删除掉
    effect.deps.forEach((dep) => {
      dep.delete(effect);
    });
  
    effect.deps.length = 0;
}

let activeEffect
let shouldTrack

export function isTracking(){
    return shouldTrack && activeEffect !== undefined
}

const targetMap = new Map()
export function track(target,key){
    if(!isTracking()) return
    // target -> key -> dep
    let depsMap = targetMap.get(target)
    if(!depsMap) {
        depsMap = new Map()
        targetMap.set(target,depsMap)
    }

    let dep = depsMap.get(key)
    if(!dep) {
        dep = new Set()
        depsMap.set(key,dep)
    }
    trackEffects(dep)
}

export function trackEffects(dep){
    // 看看 dep 之前有没有添加过，有就直接跳过了
    if(dep.has(activeEffect)) return
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
}

export function trigger(target,key){
    let depsMap = targetMap.get(target)
    let dep = depsMap.get(key)
    triggerEffects(dep)
}

export function triggerEffects(dep){
    
    for (const effect of dep) {
        if(effect.scheduler){
            effect.scheduler()
        }else{
            effect.run()
        }
    }
}

export function effect(fn,options:any = {}){
    // 传入 fn
    const _effect = new ReactiveEffect(fn,options.scheduler)
    // options
    Object.assign(_effect,options)
    _effect.run()

    const runner:any = _effect.run.bind(_effect)
    runner.effect = _effect

    return runner
}

export function stop(runner){
    runner.effect.stop()
}