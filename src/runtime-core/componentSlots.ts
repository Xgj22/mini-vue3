import { ShapeFlags } from "../shared/shapeFlags"


export function initSlots(instance,children) {
    // children object
    // instance.slots = Array.isArray(children) ? children : [children]
    const { vnode } = instance
    if(vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN){
        normalizeObjectSlots(children,instance.slots)
    }
}

function normalizeObjectSlots(children:any,slots:any){
    for (const key in children) { 
        const value = children[key]
        // slot
        slots[key] = (props) => normalizeSlotValue(value(props))
    }
}

function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value]
}