import { getCurrentInstance, h,ref,nextTick } from "../../lib/guide-mini-vue.esm.js"

export const App = {
    // setup 中的 ref 值用 unRef 包裹，在模板中才能直接使用
    setup() {
        const count = ref(0)
        const instance = getCurrentInstance()

        function onClick(){
            for(let i = 0;i<100;i++){
                console.log("update")
                count.value = i
            }

            console.log(instance)
            debugger
            nextTick(() =>{
                console.log(instance)
            })
        }

        

        return {
            onClick,
            count
        }
    },
    render() {
        const button = h("button",{ onClick : this.onClick},"update")
        const p = h("p",{},"count"+this.count)

        return h(
            "div",
            {},
            [button,p]
        )
    },
}