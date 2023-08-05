const queue:any[] = []
const activePreFlushCbs:any[] = []
let isFlushPending = false
const p = Promise.resolve()

export function nextTick(fn?){
    return fn ? p.then(fn) : p
}

export function queueJobs(job){
    if(!queue.includes(job)){
        queue.push(job)
    }
    queueFlush()
}

// watchEffect 添加
export function queuePreFlushCbs(job){
    activePreFlushCbs.push(job)

    queueFlush()
}

function queueFlush(){
    if(isFlushPending) return
    isFlushPending = true
    nextTick(flushJob)
}

function flushJob(){
    isFlushPending = false

    flushPreFlushCbs()
    let job
    // 同步代码结束执行微任务
    // component render
    while((job = queue.shift())){
        job&&job()
    }
}

function flushPreFlushCbs(){
    for(let i = 0;i<activePreFlushCbs.length;i++){
        activePreFlushCbs[i]()
    }
}