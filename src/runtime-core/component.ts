import { PublicInstanceProxyHandlers } from "./componentPublicInstance"
import { initProps } from "./componentProps"
import { shallowReadonly } from "../reactivity/reactive"
import { emit } from "./componentEmit"

// 创建组件实例
export function createComponentInstance(vnode){
    const component = {
        vnode,
        type:vnode.type,
        setupState:{},
        props:{},
        emit:()=>{}
    }
    // 为了
    component.emit = emit.bind(null,component) as any
    return component
}

export function setupComponent(instance){
    
    // TODO
    initProps(instance,instance.vnode.props)
    // initSlots()

    setupStatefulComponent(instance)
}

function setupStatefulComponent(instance){
    const Component = instance.type

    // ctx
    instance.proxy = new Proxy(
    {
        _:instance
    },
    PublicInstanceProxyHandlers)

    const { setup } = Component

    if(setup) {
        const setupResult = setup(shallowReadonly(instance.props),{
            emit:instance.emit
        })

        handleSetupResult(instance,setupResult)
    }
}

function handleSetupResult(instance,setupResult:any) {
    
    // function Object
    // TODO function

    if(typeof setupResult==='object'){
        instance.setupState = setupResult
    }

    finishComponentSetup(instance)
}

function finishComponentSetup(instance:any) {
    const Component = instance.type
    instance.render = Component.render
}