let currentInstance = {}
// 这个接口暴露给用户， 用户可以在setup中获取组件实例 instance
export function getCurrentInstance (): any {
  return currentInstance
}