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
//     h("p",{key:"C"},"C"),
//     h("p",{key:"D"},"D"),
//     h("p",{key:"E"},"E"),
// ]

// 右侧
// (a b)
// c (a b)
// const prevChildren = [
   
//     h("p",{key:"A"},"A"),
//     h("p",{key:"B"},"B")
// ]
// const nextChildren = [
    // h("p",{key:"E"},"E"),
    // h("p",{key:"D"},"D"),
//     h("p",{key:"C"},"C"),
//     h("p",{key:"A"},"A"),
//     h("p",{key:"B"},"B")
// ]

// 4. 老的比新的长

// 左侧一样
// const prevChildren = [
//     h("p",{key:"A"},"A"),
//     h("p",{key:"B"},"B"),
//     h("p",{key:"C"},"C"),
//     h("p",{key:"E"},"E"),
//     h("p",{key:"D"},"D")
// ]
// const nextChildren = [
//     h("p",{key:"A"},"A"),
//     h("p",{key:"B"},"B")
// ]

// 右侧一样
// const prevChildren = [
//     h("p",{key:"A"},"A"),
//     h("p",{key:"B"},"B"),
//     h("p",{key:"C",id:"prev-c"},"C"),
//     h("p",{key:"D"},"D"),
//     h("p",{key:"F"},"F"),
//     h("p",{key:"G"},"G"),
// ]
// const nextChildren = [
//     h("p",{key:"A"},"A"),
//     h("p",{key:"B"},"B"),
//     h("p",{key:"E"},"E"),
//     h("p",{key:"C",id:"next-c"},"C"),
//     h("p",{key:"F"},"F"),
//     h("p",{key:"G"},"G"),
// ]

// 移动（节点存在新的和老的里面，但是位置变了）

// const prevChildren = [
//     h("p",{key:"A"},"A"),
//     h("p",{key:"B"},"B"),
//     h("p",{key:"C"},"C"),
//     h("p",{key:"D"},"D"),
//     h("p",{key:"E"},"E"),
//     h("p",{key:"F"},"F"),
//     h("p",{key:"G"},"G"),
// ]
// const nextChildren = [
//     h("p",{key:"A"},"A"),
//     h("p",{key:"B"},"B"),
//     h("p",{key:"E"},"E"),
//     h("p",{key:"C"},"C"),
//     h("p",{key:"D"},"D"),
//     h("p",{key:"F"},"F"),
//     h("p",{key:"G"},"G"),
// ]
 
// 添加

// const prevChildren = [
//     h("p",{key:"A"},"A"),
//     h("p",{key:"B"},"B"),
//     h("p",{key:"C"},"C"),
//     h("p",{key:"D"},"D"),
//     h("p",{key:"E"},"E"),
//     h("p",{key:"F"},"F"),
//     h("p",{key:"G"},"G"),
// ]
// const nextChildren = [
//     h("p",{key:"A"},"A"),
//     h("p",{key:"B"},"B"),
//     h("p",{key:"C"},"C"),
//     h("p",{key:"D"},"D"),
//     h("p",{key:"Y"},"Y"),
//     h("p",{key:"E"},"E"),
//     h("p",{key:"F"},"F"),
//     h("p",{key:"G"},"G"),
// ]

// 综合
const prevChildren = [
    h("p",{key:"A"},"A"),
    h("p",{key:"B"},"B"),
    h("p",{key:"C"},"C"),
    h("p",{key:"D"},"D"),
    h("p",{key:"E"},"E"),
    h("p",{key:"Z"},"Z"),
    h("p",{key:"F"},"F"),
    h("p",{key:"G"},"G"),
]
const nextChildren = [
    h("p",{key:"A"},"A"),
    h("p",{key:"B"},"B"),
    h("p",{key:"D"},"D"),
    h("p",{key:"C"},"C"),
    h("p",{key:"Y"},"Y"),
    h("p",{key:"E"},"E"),
    h("p",{key:"F"},"F"),
    h("p",{key:"G"},"G"),
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
            ? h("div",{id:"666"},nextChildren)
            : h("div",{id:"666"},prevChildren)
    },
}