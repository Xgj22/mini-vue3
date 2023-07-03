const publicPropertiesMap = {
    $el:(i) => i.vnode.el
}

// 获取 setup 返回的值
export const PublicInstanceProxyHandlers = {
    get({_:instance},key){

        const { setupState,props } = instance
        if(key in setupState){
            return setupState[key]
        }
        const hasOwn = (val,key) => Object.prototype.hasOwnProperty.call(val,key)

        if(hasOwn(setupState,key)){
            return setupState[key]
        }else if(hasOwn(props,key)){
            return props[key]
        }

        const publicGetter = publicPropertiesMap[key]
        if(publicGetter){
            return publicGetter(instance)
        }
    }
}