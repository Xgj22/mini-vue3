import { NodeTypes } from "./ast"
import { TO_DISPLAY_STRING } from "./runtimeHelpers"

export function transform(root,options = {}){
    const context = createTransformcontext(root,options)
    // 1. 遍历 - 深度优先搜索
    traverseNode(root,context)

    // 2. 修改 text content

    // 语义化 codegenNode，ast 树的入口
    createRootCodegen(root)
    root.helpers =[...context.helpers.keys()]
}

function createRootCodegen(root){
    const child = root.children[0]
    if(child.type===NodeTypes.ELEMENT){
        root.codegenNode = child.codegenNode
    }else{
        root.codegenNode = root.children[0]
    }
}

function createTransformcontext(node,options){
    const context = {
        node,
        nodeTransform:options.nodeTransform || [],
        helpers:new Map(),
        helper(key){
            context.helpers.set(key,1)
        }
    }
    return context
}

function traverseNode(node:any,context){

    const nodeTransform = context.nodeTransform
    const exitFns:any  = []

    for(let i = 0;i<nodeTransform.length;i++){
        const transform = nodeTransform[i]
        // 先调用 后执行
        const onExit = transform(node,context)
        if(onExit) exitFns.push(onExit)
    }

    switch (node.type) {
        case NodeTypes.INTERPOLATION:
            context.helper(TO_DISPLAY_STRING)
            break;
        // 只有当 节点是根节点或 标签节点的时候 才需要去遍历子节点
        case NodeTypes.ROOT:
        case NodeTypes.ELEMENT:
            traverseChildren(node,context)
            break;
        default:
            break;
    }

    let i = exitFns.length
    while(i--){
        exitFns[i]()
    }
}

function traverseChildren(node,context){
    const children = node.children

    for(let i = 0;i<children.length;i++){
        traverseNode(children[i],context)
    }
    
}