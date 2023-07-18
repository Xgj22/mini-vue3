import { h, ref } from "../../lib/guide-mini-vue.esm.js"

// 1. 左侧的对比
// (a b) c
// (a b) d e

// const prevChildren = [
//     h("p",{key:"A"},"A"),
//     h("p",{key:"B"},"B"),
//     h("p",{key:"C"},"C")
// ]

// const nextChildren = [
//     h("p",{key:"A"},"A"),
//     h("p",{key:"B"},"B"),
//     h("p",{key:"D"},"D"),
//     h("p",{key:"E"},"E")

// ]

// 2. 右侧的对比
// a (b c)
// d e (b c)

// const prevChildren = [
//     h("p",{key:"A"},"A"),
//     h("p",{key:"B"},"B"),
//     h("p",{key:"C"},"C")
// ]

// const nextChildren = [
//     h("p",{key:"D"},"D"),
//     h("p",{key:"E"},"E"),
//     h("p",{key:"B"},"B"),
//     h("p",{key:"C"},"C")
// ]

// 3. 新的比老的长
// 创建新的
// (a b) 
// (a b) c
// const prevChildren = [
//     h("p",{key:"A"},"A"),
//     h("p",{key:"B"},"B")
// ]
// const nextChildren = [
//     h("p",{key:"A"},"A"),
//     h("p",{key:"B"},"B"),
//     h("p",{key:"C"},"C")
// ]

// 右侧
// (a b)
// c (a b)
const prevChildren = [
    h("p",{key:"A"},"A"),
    h("p",{key:"B"},"B")
]
const nextChildren = [
    h("p",{key:"C"},"C"),
    h("p",{key:"A"},"A"),
    h("p",{key:"B"},"B")
]

 

export default {
    name:'ArrayToArray',
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