import { h, ref } from "../../lib/guide-mini-vue.esm.js"
const nextChildren = "nextChildren"
const prevChildren = [h("div",{},"A"),h("div",{},"B")]

export default {
    name:'ArrayToText',
    setup() {
        let isChange = ref(false)
        window.isChange = isChange
        function onClick(){
            return !this.isChange
        }
        return {
            isChange,
            onClick
        }
    },
    render() {
        const self = this
        return self.isChange
            ? h("div",{},nextChildren)
            : h("div",{},prevChildren)
    },
}