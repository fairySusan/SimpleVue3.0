import { readonly } from '.';
import {
  ReactiveFlags,
  reactiveMap,
  readonlyMap,
  shallowReadonlyMap,
  reactive
} from './reactive'

import {
  isObject
} from '../../shared'
import { track } from './effect';

const get = createGetter()
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)

function createGetter (isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    const isExistInReactiveMap = () => 
      key === ReactiveFlags.RAW && receiver === reactiveMap.get(target)

    const isExistInReadonlyMap = () =>
      key === ReactiveFlags.RAW && receiver === readonlyMap.get(target)
    
    const isExistInShallowReadonlyMap = () =>
      key === ReactiveFlags.RAW && receiver === shallowReadonlyMap.get(target)

    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly
    } else if (
      isExistInReactiveMap() ||
      isExistInReadonlyMap() ||
      isExistInShallowReadonlyMap() 
    ) {
      return target
    }

    /* 以上是不做依赖收集的情况1.已经存在了target的代理对象 2.readonly 3.浅readonly */

    /* 下面是依赖收集的代码 */
    const res = Reflect.get(target, key, receiver)

    if (!isReadonly) {
      // 在触发get的时候进行依赖收集
      track(target, 'get', key)
    }

    if (shallow) {
      return res
    }

    if (isObject(res)) {
      // 把内部所有的是 object 的值都用 reactive 包裹，变成响应式对象
      // 如果说这个 res 值是一个对象的话，那么我们需要把获取到的 res 也转换成 reactive
      return isReadonly ? readonly(res) : reactive(res)
    }

    return res
  }
}

export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key) {
    // readonly 的响应式对象不可以修改值
    console.warn(
      `Set operation on key "${String(key)}" failed: target is readonly`,
      target
    )
    return true
  }
}

export const mutableHandlers = {
  get,
}

export const shallowReadonlyHandlers = {
  get: shallowReadonlyGet,
  set(target, key) {
    // readonly 的响应式对象不可以修改值
    console.warn(
      `Set operation on key "${String(key)}" failed: target is readonly`,
      target
    )
    return true
  }
}