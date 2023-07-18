import { effect } from "../reactivity/effect";
import { EMPTY_OBJ } from "../shared";
import { ShapeFlags } from "../shared/shapeFlags"
import { createComponentInstance,setupComponent } from "./component"
import { createAppAPI } from "./createApp";
import { Fragment,Text } from "./vnode";

export function createRender(options){

    const {
        createElement,
        patchProp:hostPatchProp,
        insert,
        remove:hostRemove,
        setElementContext
    } = options

    function render(vnode,container,parentComponent){
        // patch
        patch(null,vnode,container,parentComponent,null)
    }
    
    function patch(n1,n2,container,parentComponent,anchor){
        // 去处理组件
        // 判断是不是 element 类型
        // processElement()
        const { shapeFlag,type } = n2
        switch (type) {
            case Fragment:
                ProcessFragment(n1,n2,container,parentComponent,anchor)
                break;
            case Text:
                ProcessText(n1,n2,container)
                break;
            default:
                if(shapeFlag & ShapeFlags.ELEMENT){ // typeof string
                    processElement(n1,n2,container,parentComponent,anchor)
                }else if(shapeFlag & ShapeFlags.STATEFUL_COMPONENT){ // typeof object
                    processComponent(n1,n2,container,parentComponent,anchor)
                } 
                break;
        }
    
    }
    
    function ProcessFragment(n1,n2,container,parentComponent,anchor){
        mountChildren(n2.children,container,parentComponent,anchor)
    }
    
    function ProcessText(n1,n2,container){
        const { children } = n2
        const textNode = n2.el = document.createTextNode(children)
        container.append(textNode)
    }
    
    function processElement(n1,n2,container,parentComponent,anchor){
        if(!n1){
            mountElement(n2,container,parentComponent,anchor)
        }else{
            patchElement(n1,n2,container,parentComponent,anchor)
        }
        
    }
    
    function mountElement(n2,container,parentComponent,anchor){
        
        // 存储 el
        const el = (n2.el = createElement(n2.type))
        // string array
        const { children,shapeFlag } = n2
        console.log('n2===>',n2)
    
        if(shapeFlag & ShapeFlags.TEXT_CHILDREN){
            el.textContent = children
        }else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN){
            mountChildren(n2.children,el,parentComponent,anchor)
        }
        // props
        const { props } = n2
        for(const key in props){
            const val = props[key]
            hostPatchProp(el,key,null,val)
        }
        console.log('传过去的child',el)
    
        // container.append(el)
        console.log('parentNode===>',el.parentNode)
        console.log('container===>',container)
        insert(el,container,anchor)
    }
    
    function patchElement(n1,n2,container,parentComponent,anchor){

        const oldProps = n1.props || EMPTY_OBJ
        const newProps = n2.props || EMPTY_OBJ

        const el = ( n2.el = n1.el )
        // props
        patchProps(el,oldProps,newProps)
        patchChildren(n1,n2,container,parentComponent,anchor)
    }

    // 更新 props 逻辑
    function patchProps(el,oldProps,newProps){
        if(oldProps!==newProps){
            for (const key in newProps) {
                const preProps = oldProps[key]
                const nextProps = newProps[key]
                if(preProps!==nextProps){
                    hostPatchProp(el,key,preProps,nextProps)
                }
            }
            // 只有当 oldProps 不为空时，才需要去删除 props 里面的 key
            if(oldProps!==EMPTY_OBJ){
                // 删除没有在 newProps 里的 key
                for(const key in oldProps){
                    if(!(key in newProps)){
                        hostPatchProp(el,key,oldProps[key],null)
                    }
                }
            }
            
        }
    }

    // 更新 children 逻辑，这里要用到 Diff 算法？？？
    function patchChildren(n1,n2,container,parentComponent,anchor){
        const c1 = n1.children
        const prevShapeFlag = n1.shapeFlag
        const { shapeFlag } = n2
        const c2 = n2.children
        if(shapeFlag & ShapeFlags.TEXT_CHILDREN){
            if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN){
                // 1. 把老的 children 清空
                unmountChild(n1.children)
            }
            if(c1!==c2){
                // 2. 设置 text
                setElementContext(container,c2)
            }
        }else{
            if(prevShapeFlag & ShapeFlags.TEXT_CHILDREN){
                // 清空旧的 text
                setElementContext(container,"")
                // 挂载 children
                mountChildren(c2,container,parentComponent,anchor)
            }else{
                patchKeyedChildren(c1,c2,container,parentComponent,anchor)
            }
        }
    }

    function patchKeyedChildren(c1,c2,container,parentComponent,parentAnchor){
        let i = 0
        let e1 = c1.length - 1
        let e2 = c2.length - 1
        const l2 = c2.length

        function isSameVNodeType(n1,n2){
            return n1.type === n2.type && n1.key === n2.key
        }

        // 比较左侧
        while(i<=e1&&i<=e2){
            const n1 = c1[i]
            const n2 = c2[i]
            // if(n1===n2){ 这里不能这样判断两个节点是否相同
            // 只需判断type 和 key
            if(isSameVNodeType(n1,n2)){
                // 递归地比较孩子节点
                patch(n1,n2,container,parentComponent,parentAnchor)
            }else{
                break
            }
            // 每次移动 i 的位置
            i++
        }

        // 比较右侧
        while(i<=e1&&i<=e2){
            const n1 = c1[e1]
            const n2 = c2[e2]

            if(isSameVNodeType(n1,n2)){
                patch(n1,n2,container,parentComponent,parentAnchor)
            }else{
                break
            }
            e1--
            e2--
        }
        
        // 新的比老的长，创建
        if(i>e1){
            if(i<=e2){
                const nextPos = i + 1
                // 锚点
                const anchor = i + 1 < l2 ? c2[nextPos].el : null 
                console.log("anchor===>",anchor)
                console.log('anchorParent===>',anchor.parentNode)
                console.log("c2[nextPos].el==>",c2[nextPos].el.parentNode)
                console.log("cccccccccontainer===>",container)
                patch(null,c2[i],anchor.parentNode,parentComponent,anchor)
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

    
    function mountChildren(children,container,parentComponent,anchor){
        children.forEach(v => {
            // 初始化时第一个参数为 null
            patch(null,v,container,parentComponent,anchor)
        })
    }
    
    function processComponent(n1,n2:any,container:any,parentComponent,anchor){
        // 先挂载
        mountComponent(n1,n2,container,parentComponent,anchor)
    }
    
    function mountComponent(n1,initialVNode:any,container,parentComponent,anchor){
        const instance = createComponentInstance(initialVNode,parentComponent)
    
        setupComponent(instance)
        setupRenderEffect(initialVNode,instance,container,anchor)
    }
    
    function setupRenderEffect(initialVNode:any,instance:any,container,anchor){
        // 检测到更新的真正逻辑代码
        effect(() => {
            if(!instance.isMounted){
                const { proxy } = instance
                const subTree = (instance.subTree = instance.render.call(proxy))
                
                // n2 -> patch
                // n2 -> element ->mountElement
                patch(null,subTree,container,instance,anchor)
                // 确保所有的 element 都已经 mount
                initialVNode.el = subTree.el
                instance.isMounted = true
            }else{
                const { proxy } = instance
                const subTree = instance.render.call(proxy)
                const preSubTree = instance.subTree

                // 更新 subTree
                instance.subTree = subTree
                console.log("preSubTree===>",preSubTree)
                console.log("subTree===>",subTree)
                patch(preSubTree,subTree,container,instance,anchor)
                initialVNode.el = subTree.el
            }

        })
        
    }

    return {
        createApp:createAppAPI(render)
    }
}
