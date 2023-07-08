import { ReactiveEffect } from "./effect"

class ComputedRefImpl {
    private _getter
    private _dirty : Boolean = true
    private _value
    private _effect
    constructor(getter){

        this._effect = new ReactiveEffect(getter,() => {
            if(!this._dirty){
                this._dirty = true
            }
        })
    }

    get value(){
        // 当依赖的响应式对象的值发生改变的时候
        if(this._dirty){
            this._dirty = false
            this._value = this._effect.run()
        }

        return this._value
    }
}

export function computed(getter){
    return new ComputedRefImpl(getter)
}