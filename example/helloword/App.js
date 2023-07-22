import { h } from "../../lib/guide-mini-vue.esm.js"
import { Foo } from "./Foo.js"

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
                class:["red","hard"],
            },
            // "hi," + this.msg
            // string
            // "hi,mini-vue"
            // [h("p",{class:"red"},[h("p",{class:"red"},"xgjxgj")]),h("p",{class:"blue"},"mini-vue")]
            [h("div",{id:'xgj'},"hi,"+ this.msg),h(Foo,{
                onAdd(){
                    console.log('onAdd')
                },
                onAddFoo(a,b){
                    console.log(a,b)
                }
            })]
        )
    },

    setup() {
        return {
            msg:'mini-vue-xgj'
        }
    }
}