import { h,getCurrentInstance } from "../../lib/guide-mini-vue.esm.js"
import { Foo } from "./Foo.js"

export const App = {
    render() {
        return h("div",{},[h(Foo)])
    },

    setup() {
        const instance = getCurrentInstance()
        console.log("App:",instance)
    }
}