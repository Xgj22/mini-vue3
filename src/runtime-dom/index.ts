import { createRender } from '../runtime-core'

function createElement(type) {
    return document.createElement(type)
}

function patchProp(el,key,preVal,newVal) {
    const isOn = (key:string) => /^on[A-Z]/.test(key)
    if(isOn(key)){
        const event = key.slice(2).toLowerCase()
        el.addEventListener(event,newVal)
    }else{
        if(newVal===undefined || newVal===null){
            el.removeAttribute(key)
        }else{
            el.setAttribute(key,newVal)
        }
    }
}

function insert(child,parent,anchor) {
    parent.insertBefore(child,anchor || null)
}

function remove(child){
    const parent = child.parentNode
    if(parent){
        parent.removeChild(child)
    }
}

function setElementContext(el,text){
    el.textContent = text
}

const renderer:any = createRender({
    createElement,
    patchProp,
    insert,
    remove,
    setElementContext
})

export function createApp(...args){
    return renderer.createApp(...args)
}

export * from '../runtime-core'