'use strict';

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
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
    $slots: (i) => i.slots
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

const targetMap = new Map();
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

const isObject = function (obj) {
    return obj !== null && typeof obj === 'object';
};
const extend = Object.assign;
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

// 创建组件实例
function createComponentInstance(vnode, parentComponent) {
    console.log('currentInstance=>', parentComponent);
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        provides: (parentComponent === null || parentComponent === void 0 ? void 0 : parentComponent.provides) ? parentComponent.provides : {},
        parent: parentComponent,
        props: {},
        slots: {},
        emit: () => { }
    };
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
        instance.setupState = setupResult;
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

function createRender(options) {
    const { createElement, patchProp, insert } = options;
    function render(vnode, container, parentComponent) {
        // patch
        patch(vnode, container, parentComponent);
    }
    function patch(vnode, container, parentComponent) {
        // 去处理组件
        // 判断是不是 element 类型
        // processElement()
        const { shapeFlag, type } = vnode;
        switch (type) {
            case Fragment:
                ProcessFragment(vnode, container, parentComponent);
                break;
            case Text:
                ProcessText(vnode, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) { // typeof string
                    processElement(vnode, container, parentComponent);
                }
                else if (shapeFlag & 4 /* ShapeFlags.STATEFUL_COMPONENT */) { // typeof object
                    processComponent(vnode, container, parentComponent);
                }
                break;
        }
    }
    function ProcessFragment(vnode, container, parentComponent) {
        mountChildren(vnode, container, parentComponent);
    }
    function ProcessText(vnode, container) {
        const { children } = vnode;
        const textNode = vnode.el = document.createTextNode(children);
        container.append(textNode);
    }
    function processElement(vnode, container, parentComponent) {
        mountElement(vnode, container, parentComponent);
    }
    function mountElement(vnode, container, parentComponent) {
        // 存储 el
        const el = (vnode.el = createElement(vnode.type));
        // string array
        const { children, shapeFlag } = vnode;
        if (shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(vnode, el, parentComponent);
        }
        // props
        const { props } = vnode;
        for (const key in props) {
            const val = props[key];
            // on + Event name
            // const isOn = (key:string) => /^on[A-Z]/.test(key)
            // if(isOn(key)){
            //     const event = key.slice(2).toLowerCase()
            //     el.addEventListener(event,val)
            // }else{
            //     el.setAttribute(key,val)
            // }
            patchProp(el, key, val);
        }
        // container.append(el)
        insert(el, container);
    }
    function mountChildren(vnode, container, parentComponent) {
        vnode.children.forEach(v => {
            patch(v, container, parentComponent);
        });
    }
    function processComponent(vnode, container, parentComponent) {
        // 先挂载
        mountComponent(vnode, container, parentComponent);
    }
    function mountComponent(initialVNode, container, parentComponent) {
        const instance = createComponentInstance(initialVNode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(initialVNode, instance, container);
    }
    function setupRenderEffect(initialVNode, instance, container) {
        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        // vnode -> patch
        // vnode -> element ->mountElement
        patch(subTree, container, instance);
        // 确保所有的 element 都已经 mount
        initialVNode.el = subTree.el;
    }
    return {
        createApp: createAppAPI(render)
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, val) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, val);
    }
    else {
        el.setAttribute(key, val);
    }
}
function insert(el, parent) {
    return parent.append(el);
}
const renderer = createRender({
    createElement,
    patchProp,
    insert
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
exports.provide = provide;
exports.renderSlots = renderSlots;
