import { camelize,toHandlerKey } from "../shared/index"

export function emit(instance,event,...args){
    const { props } = instance

    // TPP
    // 先去写一个特定的行为 -》

    const handlerName = toHandlerKey(camelize(event))
    const handler = props[handlerName]
    handler && handler(...args)
}