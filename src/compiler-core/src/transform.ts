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
    root.codegenNode = root.children[0]
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

    for(let i = 0;i<nodeTransform.length;i++){
        const transform = nodeTransform[i]
        transform(node)
    }

    switch (node.type) {
        case NodeTypes.INTERPOLATION:
            context.helper(TO_DISPLAY_STRING)
            break;
        // 只有当 节点是根节点或 标签节点的时候 才需要去遍历子节点
        case NodeTypes.ROOT:
        case NodeTypes.ELEMENT:
            traverseChildren(node,context)
        default:
            break;
    }
}

function traverseChildren(node,context){
    const children = node.children

    for(let i = 0;i<children.length;i++){
        traverseNode(children[i],context)
    }
    
}