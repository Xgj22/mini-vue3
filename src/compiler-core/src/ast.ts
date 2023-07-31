import { CREATE_ELEMENT_NODE } from "./runtimeHelpers"

export const enum NodeTypes {
    INTERPOLATION,
    SIMPLE_EXPRESSION,
    ELEMENT,
    TEXT,
    ROOT,
    COMPOUND
}

export function createVNodeCall(context,tag,props,children){
    context.helper(CREATE_ELEMENT_NODE)
    return {
        type:NodeTypes.ELEMENT,
        tag,
        props,
        children
    }
}