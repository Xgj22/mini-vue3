import { createComponentInstance,setupComponent } from "./component"

export function render(vnode,container){
    // patch
    
    patch(vnode,container)
}

function patch(vnode,container){
    console.log('patch=>')
    // 去处理组件
    // 判断是不是 element 类型
    // processElement()
    console.log('VNODE_TYPE =>',vnode)
    if(typeof vnode.type === 'string'){
        console.log('element')
        processElement(vnode,container)
    }else if(typeof vnode.type === 'object'){
        console.log('component')
        processComponent(vnode,container)
    } 
}

function processElement(vnode,container){
    mountElement(vnode,container)
}

function mountElement(vnode,container){
    
    // 存储 el
    const el = (vnode.el = document.createElement(vnode.type))
    console.log('el=>',el)
    // string array
    const { children } = vnode

    if(typeof children === 'string'){
        el.textContent = children
    }else if(Array.isArray(children)){
        mountChildren(vnode,el)
    }
    // props
    const { props } = vnode
    for(const key in props){
        const val = props[key]
        el.setAttribute(key,val)
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

function setupRenderEffect(initialVNode,instance:any,container){
    const { proxy } = instance
    const subTree = instance.render.call(proxy)
    // vnode -> patch
    // vnode -> element ->mountElement
    console.log('subTreeFront=>')
    patch(subTree,container)
    console.log('subTree=>',subTree)
    // 确保所有的 element 都已经 mount
    initialVNode.el = subTree.el
}