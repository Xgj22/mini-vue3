import { NodeTypes } from "./ast"

const enum TagType {
    START,
    END
}

export function baseParse(content){
    const context = createParseContext(content)
    return createRoot(parseChildren(context,[]))
}

function parseChildren(context,ancestors) {
    const nodes:any = []

    while(!isEnd(context,ancestors)){
        
        let node
        const s = context.source
        console.log('----------------')
        console.log(ancestors)
        console.log('s==>',s)
        if(s.startsWith('{{')){
            node = parseInterpolation(context)
        }else if(s[0] === '<'){
            if(/[a-z]/i.test(s[1])){
                node = parseElement(context,ancestors)
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

function isEnd(context,ancestors){
    const s = context.source

    // 当遇到结束标签
    if(s.startsWith('</')){
        for(let i = 0;i<ancestors.length;i++){
            const tag = ancestors[i].tag
            if(s.slice(2,2+tag.length) === tag){
                return true
            }
        }
    }
    
    return !s
}

function parseText(context){

    let endIndex = context.source.length
    
    const endToken = ['<','{{']

    for(let i = 0;i<endToken.length;i++){
        const index = context.source.indexOf(endToken[i])
        
        if(index!==-1 && index < endIndex){
            endIndex = index
        }
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

function parseElement(context,ancestors){

    // 解析 tag
    const element:any = parseTag(context,TagType.START)
    ancestors.push(element)
    element.children = parseChildren(context,ancestors)
    ancestors.pop()
    if(context.source.slice(2,2+element.tag.length)===element.tag){
        // 删除处理完成的代码
        parseTag(context,TagType.END)
    }else{
        console.log(context,element.tag)
        console.log('uuuu',context.source.slice(2,2+element.tag.length))
        throw new Error(`缺少结束标签${element.tag}`)
    }


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