import { track, trigger } from "./effect"
import { reactive,readonly } from "./reactive"
import { isObject,extend } from "./shared/index.js"

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
            return isReadonly ? readonly(res):reactive(res)
        }

        if(!isReadonly){
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
