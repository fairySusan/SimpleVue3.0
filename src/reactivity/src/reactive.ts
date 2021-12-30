import {
  mutableHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers
} from './baseHandlers'

export const reactiveMap = new WeakMap() // 整个应用运行期间，都用reactiveMap来缓存所有的响应式对象
export const readonlyMap = new WeakMap()
export const shallowReadonlyMap = new WeakMap()

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
  RAW = '__v_raw'
}

export function reactive(target) {
  return createReactiveObject(target, reactiveMap, mutableHandlers)
}

/* readonly的用法
  const data = reactive({
    name: 'susan'
  })
  const readonlydata = readonly(data)
 */
export function readonly(target) {
  return createReactiveObject(target, readonlyMap, readonlyHandlers)
}

export function shallowReadonly(target) {
  return createReactiveObject(target, shallowReadonlyMap, shallowReadonlyHandlers)
}

export function isProxy(value) {
  return isReactive(value) || isReadonly(value)
}

export function isReadonly(value) {
  return !!value[ReactiveFlags.IS_READONLY]
}

export function isReactive(value) {
  // 如果 value 是 proxy 的话
  // 会触发 get 操作，而在 createGetter 里面会判断
  // 如果 value 是普通对象的话
  // 那么会返回 undefined ，那么就需要转换成布尔值, !!可以把undefined转换为boolean值
  return !!value[ReactiveFlags.IS_REACTIVE]
}

function createReactiveObject(target, proxyMap, baseHandlers) {
  // 核心就是proxy
  // 目的时可以侦听到用户的get 或者 set的动作

  // 如果命中的话就直接返回就好了*-
  // 使用缓存做的优化点
  /* 
    列如这种情景：
    const target = {name: 'susan'}
    const proxyTarget1 = reactive(target)
    const proxyTarget2 = reactive(target)
    以上并不会产生两个proxy对象，这里就是使用weakMap做的一个缓存
   */
  const existingProxy = proxyMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  const proxy = new Proxy(target, baseHandlers)

  // 把创建好的proxy给存起来
  proxyMap.set(target, proxy)

  return proxy
}