import { generate } from "../src/generate"
import { baseParse } from "../src/parse"
import { transform } from "../src/transform"
import { transformExpression } from "../src/transforms/transformExpression"


describe("codegen",() => {
    it("string",() => {
        const ast = baseParse("hi")

        transform(ast)
        const { code } = generate(ast)

        // 快照
        // 1. 抓 bug
        // 2. 有意（）
        expect(code).toMatchSnapshot()
    })

    it("iterpolation",() => {
        const ast = baseParse("{{message}}")

        transform(ast,{
            nodeTransform:[transformExpression]
        })
        const { code } = generate(ast)

        expect(code).toMatchSnapshot()
    })
})

