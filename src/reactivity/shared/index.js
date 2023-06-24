
export const isObject = function(obj){
    return obj!==null&&typeof obj === 'object'
}

export const extend = Object.assign;

export const hasChanged = (val,newVal) =>{
    return !Object.is(val,newVal)
}