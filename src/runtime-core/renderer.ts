import { ShapeFlags } from "../shared/shapeFlags"
import { createComponentInstance,setupComponent } from "./component"

export function render(vnode,container){
    // patch
    patch(vnode,container)
}

function patch(vnode,container){
    // 去处理组件
    // 判断是不是 element 类型
    // processElement()
    const { shapeFlag } = vnode
    if(shapeFlag & ShapeFlags.ELEMENT){ // typeof string
        processElement(vnode,container)
    }else if(shapeFlag & ShapeFlags.STATEFUL_COMPONENT){ // typeof object
        processComponent(vnode,container)
    } 
}

function processElement(vnode,container){
    mountElement(vnode,container)
}

function mountElement(vnode,container){
    
    // 存储 el
    const el = (vnode.el = document.createElement(vnode.type))
    // string array
    const { children,shapeFlag } = vnode

    if(shapeFlag & ShapeFlags.TEXT_CHILDREN){
        el.textContent = children
    }else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN){
        mountChildren(vnode,el)
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

function mountChildren(vnode,container){
    vnode.children.forEach(v => {
        patch(v,container)
    })
}

function processComponent(vnode:any,container:any){
    // 先挂载
    mountComponent(vnode,container)
}

function mountComponent(initialVNode:any,container){
    const instance = createComponentInstance(initialVNode)

    setupComponent(instance)
    setupRenderEffect(initialVNode,instance,container)
}

function setupRenderEffect(initialVNode:any,instance:any,container){
    const { proxy } = instance
    const subTree = instance.render.call(proxy)
    // vnode -> patch
    // vnode -> element ->mountElement
    patch(subTree,container)
    // 确保所有的 element 都已经 mount
    initialVNode.el = subTree.el
}