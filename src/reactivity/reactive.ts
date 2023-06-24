// import { track, trigger } from "./effect"
import { mutableHandlers,readonlyHandlers,shallowReadonlyHandlers } from "./baseHandlers"

function createActiveObject(raw,baseHandlers){
    return new Proxy(raw,baseHandlers)
}

export function reactive(raw){
    return createActiveObject(raw,mutableHandlers)
}

export function readonly(raw){
    return createActiveObject(raw,readonlyHandlers)
}

export function shallowReadonly(raw){
    return createActiveObject(raw,shallowReadonlyHandlers)
}

export function isReactive(value){
    return !!value["is_Reactive"]
    // 在 JavaScript 中，将变量前面加上两个感叹号 !! 的作用是将值转换为布尔类型。这种转换的方式通常被称为 "双重否定" 或 "强制类型转换"。

    // 具体而言，当我们将一个值通过 !! 运算符进行转换时，它会执行以下操作：

    // 如果值为假值（例如 false、0、null、undefined、NaN 或空字符串），则转换为 false。
    // 如果值为真值（除了上述假值之外的所有值），则转换为 true。
}

export function isReadonly(value){
    return !!value['is_Readonly']
}

export function isProxy(value){
    return isReactive(value) || isReadonly(value)
}



