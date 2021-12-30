import {createVNode} from './vnode'

/* 
const app = createApp(App)
 */
export function createAppAPI(render) {
  return function createApp(rootComponent) {
    const app = {
      _component: rootComponent,
      mount(rootContainer) {
        console.log("基于根组件创建 vnode")
        const vnode = createVNode(rootComponent)
        console.log("调用 render, 基于vnode进行开箱")
        render(vnode, rootComponent)
      }
    }
    return app
  }
}