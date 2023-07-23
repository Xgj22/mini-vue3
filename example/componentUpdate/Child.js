import { h } from "../../lib/guide-mini-vue.esm.js"

export default {
    name:'Child',
    setup(){},
    render() {
        return h("div",{id:'ChildDiv'},[h("div",{id:'last'},"child-props-msg"+this.$props.msg)])
    },
}