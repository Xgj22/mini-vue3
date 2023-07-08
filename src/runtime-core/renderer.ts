import { ShapeFlags } from "../shared/shapeFlags"
import { createComponentInstance,setupComponent } from "./component"
import { Fragment,Text } from "./vnode";

export function render(vnode,container,parentComponent){
    // patch
    patch(vnode,container,parentComponent)
}

function patch(vnode,container,parentComponent){
    // 去处理组件
    // 判断是不是 element 类型
    // processElement()
    const { shapeFlag,type } = vnode
    switch (type) {
        case Fragment:
            ProcessFragment(vnode,container,parentComponent)
            break;
        case Text:
            ProcessText(vnode,container)
            break;
        default:
            if(shapeFlag & ShapeFlags.ELEMENT){ // typeof string
                processElement(vnode,container,parentComponent)
            }else if(shapeFlag & ShapeFlags.STATEFUL_COMPONENT){ // typeof object
                processComponent(vnode,container,parentComponent)
            } 
            break;
    }

}

function ProcessFragment(vnode,container,parentComponent){
    mountChildren(vnode,container,parentComponent)
}

function ProcessText(vnode,container){
    const { children } = vnode
    const textNode = vnode.el = document.createTextNode(children)
    container.append(textNode)
}

function processElement(vnode,container,parentComponent){
    mountElement(vnode,container,parentComponent)
}

function mountElement(vnode,container,parentComponent){
    
    // 存储 el
    const el = (vnode.el = document.createElement(vnode.type))
    // string array
    const { children,shapeFlag } = vnode

    if(shapeFlag & ShapeFlags.TEXT_CHILDREN){
        el.textContent = children
    }else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN){
        mountChildren(vnode,el,parentComponent)
    }
    // props
    const { props } = vnode
    for(const key in props){
        const val = props[key]
        // on + Event name
        const isOn = (key:string) => /^on[A-Z]/.test(key)
        if(isOn(key)){
            const event = key.slice(2).toLowerCase()
            el.addEventListener(event,val)
        }else{
            el.setAttribute(key,val)
        }
    }

    container.append(el)
}

function mountChildren(vnode,container,parentComponent){
    vnode.children.forEach(v => {
        patch(v,container,parentComponent)
    })
}

function processComponent(vnode:any,container:any,parentComponent){
    // 先挂载
    mountComponent(vnode,container,parentComponent)
}

function mountComponent(initialVNode:any,container,parentComponent){
    const instance = createComponentInstance(initialVNode,parentComponent)

    setupComponent(instance)
    setupRenderEffect(initialVNode,instance,container)
}

function setupRenderEffect(initialVNode:any,instance:any,container){
    const { proxy } = instance
    const subTree = instance.render.call(proxy)

    // vnode -> patch
    // vnode -> element ->mountElement
    patch(subTree,container,instance)
    // 确保所有的 element 都已经 mount
    initialVNode.el = subTree.el
}