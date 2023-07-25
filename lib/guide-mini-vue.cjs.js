'use strict';

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        component: null,
        key: props && props.key,
        shapeFlag: getShapeFlag(type),
        el: null
    };
    // children
    if (typeof children === 'string') {
        vnode.shapeFlag |= 8 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else {
        vnode.shapeFlag |= 16 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    // 组件 + children object
    if (vnode.shapeFlag & 4 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (typeof children === 'object') {
            vnode.shapeFlag |= 32 /* ShapeFlags.SLOTS_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* ShapeFlags.ELEMENT */
        : 4 /* ShapeFlags.STATEFUL_COMPONENT */;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        // function
        if (typeof slot === 'function') {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
    $props: (i) => i.props
};
// 获取 setup 返回的值
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (key in setupState) {
            return setupState[key];
        }
        const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

// 符合单一职责的设计模式
function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

class ReactiveEffect {
    constructor(fn, scheduler) {
        this.deps = [];
        this.active = true;
        this._fn = fn;
        this.scheduler = scheduler;
    }
    run() {
        // 1. 会收集依赖
        // shouldTrack 来做区分
        if (!this.active) {
            return this._fn();
        }
        shouldTrack = true;
        activeEffect = this;
        const result = this._fn();
        // reset
        shouldTrack = false;
        return result;
    }
    stop() {
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    // 找到所有依赖这个 effect 的响应式对象
    // 从这些响应式对象里面把 effect 给删除掉
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
let activeEffect;
let shouldTrack;
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
const targetMap = new Map();
function track(target, key) {
    if (!isTracking())
        return;
    // target -> key -> dep
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
}
function trackEffects(dep) {
    // 看看 dep 之前有没有添加过，有就直接跳过了
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
function effect(fn, options = {}) {
    // 传入 fn
    const _effect = new ReactiveEffect(fn, options.scheduler);
    // options
    Object.assign(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}

const isObject = function (obj) {
    return obj !== null && typeof obj === 'object';
};
const extend = Object.assign;
const hasChanged = (val, newVal) => {
    return !Object.is(val, newVal);
};
const camelizeRE = /-(\w)/g;
/**
 * @private
 * 把烤肉串命名方式转换成驼峰命名方式
 */
const camelize = (str) => {
    return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ""));
};
/**
 * @private
 * 首字母大写
 */
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
/**
 * @private
 * 添加 on 前缀，并且首字母大写
 */
const toHandlerKey = (str) => str ? `on${capitalize(str)}` : ``;
const EMPTY_OBJ = {};

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        // 判断 key 是不是 is_Reactive ，从而判断是不是 reactive 对象
        if (key === 'is_Reactive') {
            return !isReadonly;
        }
        else if (key === 'is_Readonly') {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (shallow) {
            return res;
        }
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        if (!isReadonly) {
            // effect 函数首次收集依赖
            // 当一个副作用函数（effect函数）执行时，如果它访问了响应式对象的某个属性，
            // Vue 3会调用track函数来建立这个依赖关系。
            // track函数会将当前的副作用函数与响应式对象的属性关联起来，这样在后续响应式对象发生变化时，
            // Vue 3就能够找到相应的副作用函数，并触发它们进行更新。
            track(target, key);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn('这是 readonly');
        return true;
    }
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet
});

// import { track, trigger } from "./effect"
function createActiveObject(raw, baseHandlers) {
    return new Proxy(raw, baseHandlers);
}
function reactive(raw) {
    return createActiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createActiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createActiveObject(raw, shallowReadonlyHandlers);
}

function emit(instance, event, ...args) {
    const { props } = instance;
    // TPP
    // 先去写一个特定的行为 -》
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

function initSlots(instance, children) {
    // children object
    // instance.slots = Array.isArray(children) ? children : [children]
    const { vnode } = instance;
    if (vnode.shapeFlag & 32 /* ShapeFlags.SLOTS_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        // slot
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

// RefImpl 的程序设计
// 1 true "1"
// 1
// get set
// proxy-→object
// {}→value get set
class RefImpl {
    constructor(value) {
        this.__v_refKey = true;
        this._rawValue = value;
        this._value = isObject(value) ? reactive(value) : value;
        // value -> reactive 看看 value 是不是对象
        this.dep = new Set();
    }
    get value() {
        if (isTracking()) {
            trackEffects(this.dep);
        }
        return this._value;
    }
    set value(newValue) {
        // 如果值没有发生改变
        // 对比的时候都要是 object ，因此需要 this.rawValue
        if (hasChanged(newValue, this._rawValue)) {
            this._rawValue = newValue;
            this._value = isObject(newValue) ? reactive(newValue) : newValue;
            triggerEffects(this.dep);
        }
    }
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    return !!ref.__v_refKey;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        // 如果是 ref 对象直接替换，不是的话要修改 .value 值
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return target[key].value = value;
            }
            else {
                return Reflect.set(target, key, value);
            }
        }
    });
}

// 创建组件实例
function createComponentInstance(vnode, parentComponent) {
    console.log('currentInstance=>', vnode);
    const component = {
        vnode,
        type: vnode.type,
        next: null,
        setupState: {},
        provides: (parentComponent === null || parentComponent === void 0 ? void 0 : parentComponent.provides) ? parentComponent.provides : {},
        parent: parentComponent,
        props: {},
        slots: {},
        isMounted: false,
        emit: () => { },
        subTree: {}
    };
    console.log('component==>', component);
    // 为了
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    // TODO
    initProps(instance, instance.vnode.props);
    // initSlots()
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    // ctx
    instance.proxy = new Proxy({
        _: instance
    }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit
        });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // function Object
    // TODO function
    if (typeof setupResult === 'object') {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    instance.render = Component.render;
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function provide(key, value) {
    // 存
    const currentInstance = getCurrentInstance();
    // 如果存在 currentInstance，说明是在 setup 里面
    if (currentInstance) {
        let { provides } = currentInstance;
        // 没有以下这个 if ，以后每一个子组件不会有自己的 provides ，都是继承父组件然后往里面添加
        // 并且当有相同的 key 值时，父组件被添加新的 key 值，会被覆盖，因为是同一个 provides，所以所取到的值都是新添加的值
        // 有了之后就可以初始化，
        if (provides === currentInstance.parent.provides) {
            provides = currentInstance.provides = Object.create(currentInstance.parent.provides);
        }
        currentInstance.provides[key] = value;
    }
}
function inject(key, defaultValue) {
    // 取
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        if (key in currentInstance.parent.provides) {
            return currentInstance.parent.provides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === 'function') {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

function shouldUpdateComponent(prevVNode, nextVNode) {
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // 先 vNode
                // component -> vnode
                // 所有的逻辑操作 都会基于 vnode 做处理
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer, undefined);
            }
        };
    };
}

const queue = [];
let isFlushPending = false;
const p = Promise.resolve();
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}
function queueJobs(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
}
function queueFlush() {
    if (isFlushPending)
        return;
    isFlushPending = true;
    nextTick(flushJob);
}
function flushJob() {
    isFlushPending = false;
    let job;
    // 同步代码结束执行微任务
    while ((job = queue.shift())) {
        job && job();
    }
}

function createRender(options) {
    const { createElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementContext } = options;
    function render(vnode, container, parentComponent) {
        // patch
        patch(null, vnode, container, parentComponent, null);
    }
    function patch(n1, n2, container, parentComponent, anchor) {
        // 去处理组件
        // 判断是不是 element 类型
        // processElement()
        const { shapeFlag, type } = n2;
        switch (type) {
            case Fragment:
                ProcessFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                ProcessText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) { // typeof string
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 4 /* ShapeFlags.STATEFUL_COMPONENT */) { // typeof object
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    function ProcessFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    function ProcessText(n1, n2, container) {
        const { children } = n2;
        const textNode = n2.el = document.createTextNode(children);
        container.append(textNode);
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function mountElement(n2, container, parentComponent, anchor) {
        // 存储 el
        const el = (n2.el = createElement(n2.type));
        // string array
        const { children, shapeFlag } = n2;
        if (shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(n2.children, el, parentComponent, anchor);
        }
        // props
        const { props } = n2;
        for (const key in props) {
            const val = props[key];
            hostPatchProp(el, key, null, val);
        }
        hostInsert(el, container, anchor);
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        const el = (n2.el = n1.el);
        // props
        patchProps(el, oldProps, newProps);
        patchChildren(n1, n2, container, parentComponent, anchor);
    }
    // 更新 props 逻辑
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const preProps = oldProps[key];
                const nextProps = newProps[key];
                if (preProps !== nextProps) {
                    hostPatchProp(el, key, preProps, nextProps);
                }
            }
            // 只有当 oldProps 不为空时，才需要去删除 props 里面的 key
            if (oldProps !== EMPTY_OBJ) {
                // 删除没有在 newProps 里的 key
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    // 更新 children 逻辑，这里要用到 Diff 算法？？？
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const c1 = n1.children;
        const prevShapeFlag = n1.shapeFlag;
        const { shapeFlag } = n2;
        const c2 = n2.children;
        if (shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
            if (prevShapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                // 1. 把老的 children 清空
                unmountChild(n1.children);
            }
            if (c1 !== c2) {
                // 2. 设置 text
                setElementContext(container, c2);
            }
        }
        else {
            if (prevShapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
                // 清空旧的 text
                setElementContext(container, "");
                // 挂载 children
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                patchKeyedChildren(c1, c2, n2.el, parentComponent, anchor);
                // patchKeyedChildren(c1,c2,container,parentComponent,anchor)
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = c2.length - 1;
        const l2 = c2.length;
        let maxNewIndexSoFar = 0;
        let moved = false;
        function isSameVNodeType(n1, n2) {
            return n1.type === n2.type && n1.key === n2.key;
        }
        console.log('c1,c2===>', c1, c2);
        // 比较左侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            // if(n1===n2){ 这里不能这样判断两个节点是否相同
            // 只需判断type 和 key
            if (isSameVNodeType(n1, n2)) {
                console.log('container==>', container);
                console.log('n1,n2===>', n1, n2);
                // 递归地比较孩子节点
                patch(n1, n2, n1.el, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            // 每次移动 i 的位置
            i++;
        }
        // 比较右侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameVNodeType(n1, n2)) {
                // patch(n1,n2,container,parentComponent,parentAnchor)
                patch(n1, n2, n1.el, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        // 新的比老的长，创建
        if (i > e1) {
            if (i <= e2) {
                const nextPos = e2 + 1;
                // 锚点
                const anchor = e2 + 1 < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        else if (i > e2) { //
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            let s1 = i;
            let s2 = i;
            let toBePatch = e2 - s1 + 1;
            // 通过给定 Map ，达到快速查找 key 的目的 
            let keyToNewIndexMap = new Map();
            let newKeyToOldKeyMap = new Array(toBePatch).fill(0);
            let patched = 0;
            for (let i = s1; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                let index;
                // 判断元素身上有没有 key 值
                // 这就是为什么开发中经常需要去绑定 key 值的原因
                if ((prevChild === null || prevChild === void 0 ? void 0 : prevChild.key) != null) {
                    index = keyToNewIndexMap.get(c1[i].key);
                }
                else {
                    for (let j = s2; j <= e2; j++) {
                        // 遍历找到相同的 VNode
                        if (isSameVNodeType(c1[i], c2[j])) {
                            index = j;
                            break;
                        }
                    }
                }
                if (patched > toBePatch) {
                    // 卸载掉真实 DOM 元素
                    hostRemove(c1[i].el);
                    continue;
                }
                if (index !== undefined) {
                    if (index >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = index;
                    }
                    else {
                        moved = true;
                    }
                    // 建立映射关系
                    // 旧的在新的 的排序，便于后面确定最长递增子序列
                    newKeyToOldKeyMap[index - s2] = i + 1;
                    patch(prevChild, c2[index], container, parentComponent, null);
                    patched++;
                }
                else {
                    hostRemove(c1[i].el);
                }
            }
            // 获取最长递增子序列,得到的是递增子序列的下标
            // 如果移动了才去获取最长递增子序列
            const increasingIndexSequence = moved ? getSequence(newKeyToOldKeyMap) : [];
            let j = increasingIndexSequence.length - 1;
            for (let i = toBePatch - 1; i >= 0; i--) {
                const nextIndex = s2 + i;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                if (newKeyToOldKeyMap[i] === 0) {
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else if (j < 0 || i !== increasingIndexSequence[j]) {
                    hostInsert(nextChild.el, container, anchor);
                }
                else {
                    j--;
                }
            }
        }
    }
    function unmountChild(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            // remove
            hostRemove(el);
        }
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach(v => {
            // 初始化时第一个参数为 null
            patch(null, v, container, parentComponent, anchor);
        });
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            // 先挂载
            mountComponent(n1, n2, container, parentComponent, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2) {
        // 更新组件，需要去触发 effect 收集的的依赖，通过挂载在组件实例上的 update 
        // 如何拿到组件实例呢，需要在创建的时候把组件实例挂载到 VNode 上    
        const instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.update();
        }
        else {
            n2.el = n1.el;
        }
    }
    function mountComponent(n1, initialVNode, container, parentComponent, anchor) {
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
        console.log('initialVNode==>', initialVNode);
        setupComponent(instance);
        setupRenderEffect(initialVNode, instance, container, anchor);
    }
    function setupRenderEffect(initialVNode, instance, container, anchor) {
        // 检测到更新的真正逻辑代码
        instance.update = effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy));
                // n2 -> patch
                // n2 -> element ->mountElement
                patch(null, subTree, container, instance, anchor);
                // 确保所有的 element 都已经 mount
                initialVNode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                // 需要一个 vnode 之前的节点？
                const { next, vnode } = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPrevRender(instance, next);
                }
                const { proxy } = instance;
                const subTree = instance.render.call(proxy);
                const preSubTree = instance.subTree;
                // 更新 subTree
                instance.subTree = subTree;
                patch(preSubTree, subTree, container, instance, anchor);
                initialVNode.el = subTree.el;
            }
        }, {
            scheduler() {
                queueJobs(instance.update);
            }
        });
    }
    return {
        createApp: createAppAPI(render)
    };
}
function updateComponentPrevRender(instance, nextVNode) {
    instance.vnode = nextVNode;
    instance.next = null;
    instance.props = nextVNode.props;
}
// 获取最长递增子序列
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, preVal, newVal) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, newVal);
    }
    else {
        if (newVal === undefined || newVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, newVal);
        }
    }
}
function insert(child, parent, anchor) {
    parent.insertBefore(child, anchor || null);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementContext(el, text) {
    el.textContent = text;
}
const renderer = createRender({
    createElement,
    patchProp,
    insert,
    remove,
    setElementContext
});
function createApp(...args) {
    return renderer.createApp(...args);
}

exports.createApp = createApp;
exports.createRender = createRender;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.nextTick = nextTick;
exports.provide = provide;
exports.ref = ref;
exports.renderSlots = renderSlots;
