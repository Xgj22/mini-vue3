import { h, ref } from "../../lib/guide-mini-vue.esm.js"
const nextChildren = "nextChildren"
const prevChildren = "prevChildren"

export default {
    name:'TextToText',
    setup() {
        let isChange = ref(false)
        window.isChange = isChange
        return {
            isChange,
        }
    },
    render() {
        const self = this
        return self.isChange
            ? h("div",{},nextChildren)
            : h("div",{},prevChildren)
    },
}