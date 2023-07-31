import { isString } from "../../shared"
import { NodeTypes } from "./ast"
import { CREATE_ELEMENT_NODE, TO_DISPLAY_STRING, helperMapName } from "./runtimeHelpers"

export function generate(ast){
    const context = createCodegenContext()
    const { push } = context
    
    getFunctionPreamble(ast,context)

    const functionName = 'render'
    const args = ['_ctx','_cache']
    const signature = args.join(', ')

    push(`function ${functionName}(${signature}){`)
    push('return ')
    // 处理节点
    genNode(ast.codegenNode,context)
    push('}')

    return {
        code:context.code
    }
}

function getFunctionPreamble(ast,context){
    const { push } = context
    // toDisplayString 是一直跟着 插值 的
    const VueBinging = "Vue"
    // helpers 应该是基于类型处理，不应该写死在 generate 里
    // const helpers = ['toDisplayString']
    const aliasHelper = (s) => `${helperMapName[s]}:_${helperMapName[s]}`
    // 如果是文本类型，则直接跳过
    if(ast.helpers.length > 0){
        push(`${ast.helpers.map(aliasHelper).join(', ')} = ${VueBinging}`)
    }
    push('\n')
    push('return ')
}

function createCodegenContext() {
    const context = {
        code:'',
        push(source){
            context.code += source
        },
        helper(key){
            return `_${helperMapName[key]}`
        }
    }
    return context
}

function genNode(node,context){
    switch (node.type) {
        case NodeTypes.TEXT:
            genText(node,context)
            break;
        case NodeTypes.ELEMENT:
            genElement(node,context)
            break;
        case NodeTypes.COMPOUND:
            genCompoundExpression(node,context)
            break
        case NodeTypes.INTERPOLATION:
            genInterpolation(node,context)
            break;
        case NodeTypes.SIMPLE_EXPRESSION:
            genExpression(node,context)
            break;
    }
    
}

function genCompoundExpression(node,context){
    const { children } = node
    const { push } = context
    for(let i = 0;i<children.length;i++){
        const child = children[i]
        if(isString(child)){
            push(child)
        }else{
            genNode(child,context)
        }
    }
}

function genElement(node,context){
    const { tag,props,children } = node
    const { push,helper } = context
    push(`${helper(CREATE_ELEMENT_NODE)}( `)
    genNodeList(getNullable([tag,props,children]),context)
    // genNode(children,context)
    push(')')
}

function getNullable(args){
    return args.map(arg => arg ? arg : 'null')
}

function genNodeList(nodes,context){
    const { push } = context
    for (let i = 0; i < nodes.length; i++) {
        if(isString(nodes[i])){
            push(nodes[i])
        }else{
            genNode(nodes[i],context)
        }

        if(i<nodes.length-1){
            push(',')
        }
    }
}

function genExpression(node,context){
    const { push } = context
    // 处理 ast 树上的数据应该放在 transform 里面
    // push(`_ctx.${node.content}`)
    push(`${node.content}`)
}

function genInterpolation(node,context){
    const { push,helper } = context
    push(`${helper(TO_DISPLAY_STRING)}(`)
    genNode(node.content,context)
    push(')')
}

function genText(node,context){
    const { push } = context
    push(`'${node.content}'`)
}