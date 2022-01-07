import { emit } from "./componentEmits";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";
import { proxyRefs, shallowReadonly } from "../reactivity/src";


let currentInstance = {}


export function createComponentInstance(vnode,parent) {
  const instance = {
    type: vnode.type,
    vnode,
    next:null,// 需要更新的 vnode，用于更新 component 类型的组件
    props: {},
    parent,
    provide:parent ? parent.provide : {},
    proxy: null,
    isMounted: false,
    attrs: {}, // 存放 attrs 的数据
    slots: {}, // 存放插槽的数据
    ctx: {}, // context 对象
    setupState: {}, // 存储 setup 的返回值
    emit: () => {}
  };

  // 在 prod 环境下的 ctx 只是下面简单的结构，在dev环境下更复杂
  instance.ctx = {
    _: instance
  }

  /*
    赋值emit 
   */
  instance.emit = emit.bind(null, instance) as any;
  return instance
}

export function setupComponent(instance) {
  // 1. 处理 props
  // 取出存在 vnode 里面的 props
  const { props, children } = instance.vnode;
  initProps(instance, props);
  // 2. 处理 slots
  initSlots(instance, children);

  // 源码里面有两种类型的 component
  // 一种是基于 options 创建的
  // 还有一种是 function 的
  // 这里处理的是 options 创建的
  // 叫做 stateful 类型
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
  // 1. 先创建代理 proxy
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);

  // 2. 调用 setup
  const Component = instance.type;
  // 调用 setup 的时候传入 props
  const { setup } = Component;

  if (setup) {
    // 设置当前 currentInstance 的值
    // 必须要在调用 setup 之前
    setCurrentInstance(instance);
    const setupContext = createSetupContext(instance);
    // 真实的处理场景里面应该是只在 dev 环境才会把 props 设置为只读的
    const setupResult = setup && setup(shallowReadonly(instance.props), setupContext);
    setCurrentInstance(null);

    // 3. 处理 setupResult
    handleSetupResult(instance, setupResult);
  } else {
    finishComponentSetup(instance);
  }
}

function createSetupContext(instance) {
  console.log("初始化 setup context");
  return {
    attrs: instance.attrs,
    slots: instance.slots,
    emit: instance.emit,
    expose: () => {}, // TODO 实现 expose 函数逻辑
  };
}

function handleSetupResult(instance, setupResult) {
  // setup 返回值不一样的话，会有不同的处理
  // 1. 看看 setupResult 是个什么
  if (typeof setupResult === "function") {
    // 如果返回的是 function 的话，那么绑定到 render 上
    // 认为是 render 逻辑
    // setup(){ return ()=>(h("div")) }
    instance.render = setupResult;
  } else if (typeof setupResult === "object") {
    // 返回的是一个对象的话
    // 先存到 setupState 上
    // 先使用 @vue/reactivity 里面的 proxyRefs
    // 后面我们自己构建
    // proxyRefs 的作用就是把 setupResult 对象做一层代理
    // 方便用户直接访问 ref 类型的值
    // 比如 setupResult 里面有个 count 是个 ref 类型的对象，用户使用的时候就可以直接使用 count 了，而不需要在 count.value
    // 这里也就是官网里面说到的自动结构 Ref 类型
    instance.setupState = proxyRefs(setupResult);
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
  // 给 instance 设置 render

  // 先取到用户设置的 component options
  const Component = instance.type;

  if (!instance.render) {
    // todo
    // 调用 compile 模块来编译 template
    // Component.render = compile(Component.template, {
    //     isCustomElement: instance.appContext.config.isCustomElement || NO
    //   })
    instance.render = Component.render;
  }

  // applyOptions()
}

// 这个接口暴露给用户， 用户可以在setup中获取组件实例 instance
export function getCurrentInstance (): any {
  return currentInstance
}

export function setCurrentInstance(instance) {
  currentInstance = instance;
}
