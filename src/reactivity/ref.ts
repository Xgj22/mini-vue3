import { isTracking, trackEffects,  triggerEffects } from "./effect"
import { reactive } from "./reactive"
import { hasChanged,isObject } from './shared'

// RefImpl 的程序设计
// 1 true "1"
// 1
// get set
// proxy-→object
// {}→value get set

class RefImpl {
    private _value
    public dep
    private _rawValue
    public __v_refKey = true
    constructor(value){
        this._rawValue = value
        this._value = isObject(value) ? reactive(value) : value
        // value -> reactive 看看 value 是不是对象
        this.dep = new Set()
    }

    get value(){
        if(isTracking()){
            trackEffects(this.dep)
        }
        return this._value
    }

    set value(newValue){
        // 如果值没有发生改变
        // 对比的时候都要是 object ，因此需要 this.rawValue
        if(hasChanged(newValue,this._rawValue)){
            this._rawValue = newValue
            this._value = isObject(newValue) ? reactive(newValue) : newValue
            triggerEffects(this.dep)    
        }
    }
}


export function ref(value){
    return new RefImpl(value)
}


export function isRef(ref){
    return !!ref.__v_refKey
}

export function unRef(ref){
    return isRef(ref) ? ref.value : ref
}

export function proxyRefs(objectWithRefs){
    return new Proxy(objectWithRefs,{
        get(target,key){
            return unRef(Reflect.get(target,key))
        },
        // 如果是 ref 对象直接替换，不是的话要修改 .value 值
        set(target,key,value){
            if(isRef(target[key])&&!isRef(value)){
                return target[key].value = value
            }else{
                return Reflect.set(target,key,value)
            }
        }
    })
}
