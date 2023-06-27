import { h } from "../../lib/guide-mini-vue.esm.js"

window.self = null
export const App = {
    // .vue
    // <template></template>
    // render
    render() {
        window.self = this
        return h(
            "div",
            {
                id:"root",
                class:["red","hard"]
            },
            // "hi," + this.msg
            // string
            // "hi,mini-vue"
            [h("p",{class:"red"},[h("p",{class:"red"},"xgjxgj")]),h("p",{class:"blue"},"mini-vue")]

        )
    },

    setup() {
        return {
            msg:'mini-vue-xgj'
        }
    }
}