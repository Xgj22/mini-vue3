import { effect } from "../reactivity/effect";
import { EMPTY_OBJ } from "../shared";
import { ShapeFlags } from "../shared/shapeFlags"
import { createComponentInstance,setupComponent } from "./component"
import { createAppAPI } from "./createApp";
import { Fragment,Text } from "./vnode";

export function createRender(options){

    const {
        createElement,
        patchProp,
        insert,
        remove:hostRemove,
        setElementContext
    } = options

    function render(vnode,container,parentComponent){
        // patch
        patch(null,vnode,container,parentComponent)
    }
    
    function patch(n1,n2,container,parentComponent){
        console.log(n1,n2)
        // 去处理组件
        // 判断是不是 element 类型
        // processElement()
        const { shapeFlag,type } = n2
        switch (type) {
            case Fragment:
                ProcessFragment(n2,container,parentComponent)
                break;
            case Text:
                ProcessText(n2,container)
                break;
            default:
                if(shapeFlag & ShapeFlags.ELEMENT){ // typeof string
                    processElement(n1,n2,container,parentComponent)
                }else if(shapeFlag & ShapeFlags.STATEFUL_COMPONENT){ // typeof object
                    processComponent(n2,container,parentComponent)
                } 
                break;
        }
    
    }
    
    function ProcessFragment(n2,container,parentComponent){
        mountChildren(n2.children,container,parentComponent)
    }
    
    function ProcessText(n2,container){
        const { children } = n2
        const textNode = n2.el = document.createTextNode(children)
        container.append(textNode)
    }
    
    function processElement(n1,n2,container,parentComponent){
        if(!n1){
            mountElement(n2,container,parentComponent)
        }else{
            patchElement(n1,n2,container,parentComponent)
        }
        
    }
    
    function mountElement(n2,container,parentComponent){
        
        // 存储 el
        const el = (n2.el = createElement(n2.type))
        // string array
        const { children,shapeFlag } = n2
    
        if(shapeFlag & ShapeFlags.TEXT_CHILDREN){
            el.textContent = children
        }else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN){
            mountChildren(n2.children,el,parentComponent)
        }
        // props
        const { props } = n2
        for(const key in props){
            const val = props[key]
            patchProp(el,key,null,val)
        }
    
        // container.append(el)
        insert(el,container)
    }
    
    function patchElement(n1,n2,container,parentComponent){

        const oldProps = n1.props || EMPTY_OBJ
        const newProps = n2.props || EMPTY_OBJ

        const el = ( n2.el = n1.el )
        // props
        patchProps(el,oldProps,newProps)
        patchChildren(n1,n2,container,parentComponent)
    }

    // 更新 children 逻辑，这里要用到 Diff 算法？？？
    function patchChildren(n1,n2,container,parentComponent){
        const prevShapeFlag = n1.shapeFlag
        const { shapeFlag } = n2
        const c2 = n2.children
        console.log(c2)
        if(shapeFlag & ShapeFlags.TEXT_CHILDREN){
            console.log(123)
            if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN){
                console.log("ArrayToText")
                // 1. 把老的 children 清空
                unmountChild(n1.children)
            }
            // 2. 设置 text
            setElementContext(container,c2)
        }else{
            if(prevShapeFlag & ShapeFlags.TEXT_CHILDREN){
                // 清空旧的 text
                setElementContext(container,"")
                // 挂载 children
                mountChildren(c2,container,parentComponent)
            }
        }
    }

    function unmountChild(children){
        for(let i = 0;i<children.length;i++){
            const el = children[i].el
            // remove
            hostRemove(el)
        }
    }

    // 更新 props 逻辑
    function patchProps(el,oldProps,newProps){
        if(oldProps!==newProps){
            for (const key in newProps) {
                const preProps = oldProps[key]
                const nextProps = newProps[key]
                if(preProps!==nextProps){
                    patchProp(el,key,preProps,nextProps)
                }
            }
            // 只有当 oldProps 不为空时，才需要去删除 props 里面的 key
            if(oldProps!==EMPTY_OBJ){
                // 删除没有在 newProps 里的 key
                for(const key in oldProps){
                    if(!(key in newProps)){
                        patchProp(el,key,oldProps[key],null)
                    }
                }
            }
            
        }
    }
    function mountChildren(children,container,parentComponent){
        children.forEach(v => {
            // 初始化前面加 null
            patch(null,v,container,parentComponent)
        })
    }
    
    function processComponent(n2:any,container:any,parentComponent){
        // 先挂载
        mountComponent(n2,container,parentComponent)
    }
    
    function mountComponent(initialVNode:any,container,parentComponent){
        const instance = createComponentInstance(initialVNode,parentComponent)
    
        setupComponent(instance)
        setupRenderEffect(initialVNode,instance,container)
    }
    
    function setupRenderEffect(initialVNode:any,instance:any,container){
        // 检测到更新的真正逻辑代码
        effect(() => {

            if(!instance.isMounted){
                const { proxy } = instance
                const subTree = (instance.subTree = instance.render.call(proxy))
            
                // n2 -> patch
                // n2 -> element ->mountElement
                patch(null,subTree,container,instance)
                // 确保所有的 element 都已经 mount
                initialVNode.el = subTree.el
                instance.isMounted = true
            }else{
                const { proxy } = instance
                const preSubTree = instance.subTree
                const subTree = (instance.subTree = instance.render.call(proxy))

                patch(preSubTree,subTree,container,instance)
                initialVNode.el = subTree.el
            }

        })
        
    }

    return {
        createApp:createAppAPI(render)
    }
}
