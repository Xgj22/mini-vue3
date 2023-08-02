import { generate } from "./generate";
import { baseParse } from "./parse";
import { transform } from "./transform";
import { transformElement } from "./transforms/transformElement";
import { transformExpression } from "./transforms/transformExpression";
import { transfromText } from "./transforms/transformText";

export function baseCompile(template){
    const ast:any = baseParse(template)
    transform(ast,{
        nodeTransform:[transformExpression,transformElement,transfromText] // 
    })
    return generate(ast)

}