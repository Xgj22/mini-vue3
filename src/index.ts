// mini-vue 出口
export * from './runtime-dom'

import { baseCompile } from './compiler-core/src/compile'
import { registerRuntimeCompiler } from './runtime-core/component'
import * as runtimeDom from './runtime-dom'

function compileToFunction(template){
    const { code } = baseCompile(template)
    console.log(code)
    const render = new Function("Vue",code)(runtimeDom)
    console.log(render)
    return render

}

registerRuntimeCompiler(compileToFunction)