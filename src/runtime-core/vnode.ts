import { ShapeFlags } from "../shared/shapeFlags"


export function createVNode (type,props?,children?){
    const vnode = {
        type,
        props,
        children,
        shapeFlag:getShapeFlag(type),
        el:null
    }

    // children
    if(typeof children === 'string'){
        vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN
    }else{
        vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN
    }
    return vnode
}

function getShapeFlag(type){
    return typeof type === "string"
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT
}