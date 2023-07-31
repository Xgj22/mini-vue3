import { NodeTypes } from "../ast";


export function transfromText(node){
    if(node.type===NodeTypes.ELEMENT){
        
        return () => {
            const { children } = node

            function isText(node){
                return node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TEXT
            }

            let currentContainer
            // 设置一个新的类型 compound ，包裹 text 和 插值
            for(let i = 0;i<children.length;i++){
                const child = children[i]
                if(isText(child)){
                    for(let j = i+1;j<children.length;j++){
                        const next = children[j]
                        if(isText(next)){
                            if(!currentContainer){
                                currentContainer = children[i] = {
                                    type:NodeTypes.COMPOUND,
                                    children:[child]
                                }
                            }
                            currentContainer.children.push(' + ')
                            currentContainer.children.push(next)
                            children.splice(j,1)
                            j--
                        }else{
                            currentContainer = undefined
                            break
                        }
                    }
                }
            }
        }
    }
}