import { createDep } from "./dep"
import { ReactiveEffect } from "./effect"
import { trackRefValue, triggerRefValue } from "./ref"

export class ComputedRefImpl {
  public dep: any
  public effect: ReactiveEffect

  private _dirty: boolean
  private _value

  constructor(getter) {
    this._dirty = true
    this.dep = createDep()
    this.effect = new ReactiveEffect(getter, () => {
      // scheduler
      // 只要触发了这个函数说明响应式对象的值发生改变了
      // 那么就解锁，后续在调用 get 的时候就会重新执行，所以会得到最新的值
      if (this._dirty) return

      this._dirty = true
      /*
      首次执行getter，执行getter的时候触发this.fullName.firstName的get函数，
      this.fullName.firstName进行依赖收集，将这里的getter收集到自己的dep里，当this.fullName.firstName='newName',触发
      this.fullName.firstName的set函数，从而执行这里的getter，返回计算属性的值,
      同时也activeEffect也指向了这里的getter， 当再次读取计算属性firstName的时候，触发它get函数，执行getter
      */
      triggerRefValue(this)
    })
  }

  get value() {
    // 收集依赖
    trackRefValue(this)
    // 锁上，只可以调用一次
    // 当数据改变的时候才会解锁
    // 这里就是缓存实现的核心
    // 解锁是在 scheduler 里面做的
    if(this._dirty) {
      this._dirty = false
      // 这里执行 run 的话，就是执行用户传入的 fn
      this._value = this.effect.run()
    }

    return this._value
  }
}

/* 注意computed属性时如何实现缓存的？ 
  const firstName: ComputedRefImpl = computed(() => {
    return this.fullName.firstName
  })
*/
export function computed(getter) {
  return new ComputedRefImpl(getter)
}