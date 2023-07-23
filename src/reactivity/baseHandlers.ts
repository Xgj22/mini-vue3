import { track, trigger } from "./effect"
import { reactive,readonly } from "./reactive"
import { isObject,extend } from "../shared/index"

const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true,true)

function createGetter(isReadonly = false,shallow = false){
    return function get(target,key){

        // 判断 key 是不是 is_Reactive ，从而判断是不是 reactive 对象
        if(key==='is_Reactive'){
            return !isReadonly
        }else if(key==='is_Readonly'){
            return isReadonly
        }

        const res = Reflect.get(target,key)

        if(shallow){
            return res
        }

        if(isObject(res)){
            return isReadonly ? readonly(res) : reactive(res)
        }

        if(!isReadonly){
            // effect 函数首次收集依赖
            // 当一个副作用函数（effect函数）执行时，如果它访问了响应式对象的某个属性，
            // Vue 3会调用track函数来建立这个依赖关系。
            // track函数会将当前的副作用函数与响应式对象的属性关联起来，这样在后续响应式对象发生变化时，
            // Vue 3就能够找到相应的副作用函数，并触发它们进行更新。
            track(target,key)
        }
        return res
    }
}

function createSetter(){
    return function set(target,key,value){
        const res = Reflect.set(target,key,value)

        trigger(target,key)
        return res
    }
}

export const mutableHandlers = {
    get,
    set
}

export const readonlyHandlers = {
    get:readonlyGet,

    set(target,key,value){
        console.warn('这是 readonly')
        return true
    }
}

export const shallowReadonlyHandlers = extend({},readonlyHandlers,{
    get:shallowReadonlyGet
})
