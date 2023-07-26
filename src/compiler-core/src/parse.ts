import { NodeTypes } from "./ast"

const enum TagType {
    START,
    END
}

export function baseParse(content){
    const context = createParseContext(content)
    return createRoot(parseChildren(context,""))
}

function parseChildren(context,parentTag) {
    const nodes:any = []

    while(!isEnd(context,parentTag)){
        let node
        const s = context.source
        if(s.startsWith('{{')){
            node = parseInterpolation(context)
        }else if(s[0] === '<'){
            if(/[a-z]/i.test(s[1])){
                node = parseElement(context)
            }
        }
    
        // context.source 没有匹配到插值和 DOM 标签
        if(!node){
            node = parseText(context)
        }
        nodes.push(node)
    }
    return nodes
}

function isEnd(context,parentTag){
    const s = context.source

    // 当遇到结束标签
    if(s.startsWith(`</${parentTag}>`)){
        return true
    }
    return !s
}

function parseText(context){

    let endIndex = context.source.length
    
    const index = context.source.indexOf('{{')

    if(index!==-1){
        endIndex = index
    }

    const content = parseTextData(context,endIndex)

    return {
        type:NodeTypes.TEXT,
        content
    }
}

function parseTextData(context,length){
    const content = context.source.slice(0,length)

    // 推进
    advanceBy(context,length)
    return content
}

function parseElement(context){

    // 解析 tag
    const element:any = parseTag(context,TagType.START)
    console.log('element==>',element)

    element.children = parseChildren(context,element.tag)

    // 删除处理完成的代码
    parseTag(context,TagType.END)

    return element
}

function parseTag(context,tagType){
    
    const reg = /^<\/?([a-z]*)/

    const match:any = reg.exec(context.source)

    const tag = match[1]

    // 删除处理完成的代码
    advanceBy(context,match[0].length)
    advanceBy(context,1)

    // 当删除多余代码时，无需返回element
    if(tagType==='END') return

    return {
        type:NodeTypes.ELEMENT,
        tag
    }
}

function parseInterpolation(context) {

    const openDelimiter = '{{'
    const closeDelimiter = '}}'

    const closeIndex = context.source.indexOf(closeDelimiter,closeDelimiter.length)

    advanceBy(context,openDelimiter.length)

    const rawContentLength = closeIndex - openDelimiter.length
    
    const content = parseTextData(context,rawContentLength).trim()

    advanceBy(context,closeDelimiter.length)

    return {
        type:NodeTypes.INTERPOLATION,
        content:{
            type:NodeTypes.SIMPLE_EXPRESSION,
            content:content
        }
    }
}

// 推进
function advanceBy(context,length){
    context.source = context.source.slice(length)
}

function createRoot(children){
    return {
        children
    }
}

function createParseContext(content) {
    return {
        source:content
    }
}