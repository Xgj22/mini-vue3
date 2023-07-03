import { h } from "../../lib/guide-mini-vue.esm.js"

export const Foo = {
    setup(props,{ emit }) {
        // props.count
        // console.log(props.count)
        // // shallowReadonly
        // props.count ++
        // console.log(props.count)
        const emitAdd = () => {
            console.log('emit add')
            emit("add")
            emit("add-foo",1,2)
        }

        return {
            emitAdd
        }
    },
    render() {
        const btn = h(
            "button",
            {
                onClick:this.emitAdd
            },
            "emitAdd"
        )

        const foo = h("p",{},"foo")
        return h("div",{},[foo,btn])
    },
}