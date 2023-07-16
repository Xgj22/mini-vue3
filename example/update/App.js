import { h,ref } from "../../lib/guide-mini-vue.esm.js"

export const App = {
    // setup 中的 ref 值用 unRef 包裹，在模板中才能直接使用
    setup() {
        const count = ref(0)
        const onClick = () => {
            count.value++
        }
        return {
            count,
            onClick
        }
    },
    render() {
        return h(
            "div",
            {
                id:"root"
            },
            [
                h("p",{},"count："+this.count),
                h("button",{
                    onClick:this.onClick
                },"click")
            ]
        )
    },
}