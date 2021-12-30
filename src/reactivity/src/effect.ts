import { createDep } from "./dep";

let activeEffect = void 0 // void 后面跟什么都是返回的undefined，activeEffect是正在收集的这个effect
let shouldTrack = false // 是否可以开始依赖收集
const targetMap = new WeakMap()

// 用于依赖收集
export class ReactiveEffect {
  active = true
  fn = undefined
  scheduler = undefined
  deps = []
  public onStop?: () => void
  constructor(fn, scheduler?) {
    this.fn = fn
    this.scheduler = scheduler
    console.log("创建 ReactiveEffect 对象");
  }

  run() {
    console.log('run')

    // 只执行fn，不进行依赖收集
    if (!this.active) {
      return this.fn()
    }

    // 执行 fn  收集依赖
    // 可以开始收集依赖了
    shouldTrack = true;

    // 执行的时候给全局的 activeEffect 赋值
    // 利用全局属性来获取当前的 effect
    activeEffect = this as any;
    // 执行用户传入的 fn
    console.log("执行用户传入的 fn");
    const result = this.fn(); // 执行这个fn的过程中执行data.name代码 触发name的get函数， 执行dep.add(activeEffect)， 依赖收集成功
    // 重置
    shouldTrack = false;
    activeEffect = undefined;

    return result;
  }

  stop() {
    if(this.active) {
      // 如果第一次执行 stop 后 active 就 false 了
      // 这是为了防止重复的调用，执行 stop 逻辑
      cleanupEffect(this)
      if(this.onStop) {
        this.onStop()
      }
      this.active = false
    }
  }
}

function cleanupEffect(effect) {
  // 找到所有依赖这个 effect 的响应式对象
  // 从这些响应式对象里面把 effect 给删除掉
  effect.deps.forEach(dep => {
    dep.delete(effect)
  })
}

export function effect (fn, options = {}) {
  const _effect = new ReactiveEffect(fn)
}

export function stop(runner) {
  runner.effect.stop()
}

export function track (target, type, key) {
  // 不懂？？？？？
  if (!isTracking()) {
    return
  }
  console.log(`触发 track -> target: ${target} type:${type} key:${key}`);
  // 1. 先基于 target 找到对应的 dep
  // 如果是第一次的话。那么就需要初始化
  let depsMap = targetMap.get(target)

  if (!depsMap) {
    // 初始化 depsMap 的逻辑
    depsMap = new Map() // depsMap是关于依赖的maps, const person = reactive({name: 'susan', age:10}), 一个name对应一个dep，一个age对应一个dep
    targetMap.set(target, depsMap)
  }

  let dep = depsMap.get(key) // 当执行到data.name代码时， 取出 name对应的dep

  if (!dep) {
    dep = createDep() // dep就是一个当data.name发生变化需要执行哪些“更新函数”的Set数组

    depsMap.set(key, dep)
  }

  trackEffects(dep)
}

/* 收集依赖： dep.add(activeEffect)*/
export function trackEffects(dep) {
  // 用 dep 来存放所有的 effect
  /* 
    这里判断一下data.name 之前有没有收集过，现在正在收集的effect，如果之前收集过了，就不再收集了
   */
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect)
    (activeEffect as any).deps.push(dep) // ??????????????
  }
}

export function isTracking() {
  return shouldTrack && activeEffect !== undefined
}

/* 触发依赖的执行 */
export function triggerEffects(dep) {
  // 执行收集到的所有的 effect 的 run 方法
  for (const effect of dep) {
    if (effect.scheduler) {
      // scheduler 可以让用户自己选择调用的时机
      // 这样就可以灵活的控制调用了
      // 在 runtime-core 中，就是使用了 scheduler 实现了在 next ticker 中调用的逻辑
      effect.scheduler()
    } else {
      effect.run()
    }
  }
}