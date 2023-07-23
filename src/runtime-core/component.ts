import { PublicInstanceProxyHandlers } from "./componentPublicInstance"
import { initProps } from "./componentProps"
import { shallowReadonly } from "../reactivity/reactive"
import { emit } from "./componentEmit"
import { initSlots } from "./componentSlots"
import { proxyRefs } from "../reactivity/ref"

// 创建组件实例
export function createComponentInstance(vnode,parentComponent){
    console.log('currentInstance=>',vnode)
    const component = {
        vnode,
        type:vnode.type,
        next:null,
        setupState:{},
        provides:parentComponent?.provides ? parentComponent.provides : {}, // 浅拷贝
        parent:parentComponent,
        props:{},
        slots:{},
        isMounted:false,
        emit:()=>{},
        subTree:{}
    }
    console.log('component==>',component)
    // 为了
    component.emit = emit.bind(null,component) as any
    return component
}

export function setupComponent(instance){
    
    // TODO
    initProps(instance,instance.vnode.props)
    // initSlots()
    initSlots(instance,instance.vnode.children)
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
        setCurrentInstance(instance)
        const setupResult = setup(shallowReadonly(instance.props),{
            emit:instance.emit
        })
        setCurrentInstance(null)

        handleSetupResult(instance,setupResult)
    }
}

function handleSetupResult(instance,setupResult:any) {
    
    // function Object
    // TODO function

    if(typeof setupResult==='object'){
        instance.setupState = proxyRefs(setupResult)
    }

    finishComponentSetup(instance)
}

function finishComponentSetup(instance:any) {
    const Component = instance.type
    instance.render = Component.render
}

let currentInstance = null

export function getCurrentInstance(){
    return currentInstance
}

function setCurrentInstance(instance){
    currentInstance = instance
}