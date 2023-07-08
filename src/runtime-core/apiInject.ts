import { getCurrentInstance } from "./component";


export function provide(key,value) {
    // 存
    const currentInstance:any = getCurrentInstance()
    // 如果存在 currentInstance，说明是在 setup 里面
    if(currentInstance){
        let { provides } = currentInstance
        // 没有以下这个 if ，以后每一个子组件不会有自己的 provides ，都是继承父组件然后往里面添加
        // 并且当有相同的 key 值时，父组件被添加新的 key 值，会被覆盖，因为是同一个 provides，所以所取到的值都是新添加的值
        // 有了之后就可以初始化，
        if(provides===currentInstance.parent.provides){
            provides = currentInstance.provides = Object.create(currentInstance.parent.provides)
        }
        currentInstance.provides[key] = value
    }
}

export function inject(key,defaultValue){
    // 取
    const currentInstance:any = getCurrentInstance()
    if(currentInstance){
        if(key in currentInstance.parent.provides){
            return currentInstance.parent.provides[key]
        }else if(defaultValue){
            if(typeof defaultValue === 'function'){
                return defaultValue()
            }
            return defaultValue
        }
        
    }
}