import { h,ref } from "../../lib/guide-mini-vue.esm.js"
import ArrayToText from './ArrayToText.js'
import TextToText from "./TextToText.js"
import TextToArray from "./TextToArray.js"
import ArrayToArray from "./ArrayToArray.js"

export const App = {
    // setup 中的 ref 值用 proxyref 包裹，在模板中才能直接使用
    setup() {
    },
    render() {
        return h(
            "div",
            {
                id:"root",
            },
            [h("p",{},"主页"),h("div",{id:"div1"},[
                // h(ArrayToText),
                // h(TextToText),
                // h(TextToArray)
                h(ArrayToArray)
            ])]
        )
        
    },
}