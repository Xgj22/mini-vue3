import { h,createTextVNode } from "../../lib/guide-mini-vue.esm.js"
import { Foo } from "./Foo.js"

window.self = null
export const App = {
    // .vue
    // <template></template>
    // render
    render() {
        const app = h("div",{},"App")

        const foo = h(
            Foo,
            {},
            {
                header:({ age }) => h("p",{},"header"+age),
                footer:() => [
                    h("p",{},"footer1"),
                    createTextVNode("123")
                ]
            }
        )
        return h("div",{},[app,foo])
    },

    setup() {
        return {}
    }
}