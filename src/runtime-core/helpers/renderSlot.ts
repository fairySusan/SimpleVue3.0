import { createVNode, Fragment } from "../vnode";

/*
Complier runtime helper for render `<slot/>`
用来渲染slot的 
 */
export function renderSlot(slots, name:string, props = {}) {
  const slot = slots[name]
  console.log(`渲染插槽 slot -> ${name}`);
  if (slot) {
    /* slotContent 就是vnode */
    const slotContent = slot(props)
    return createVNode(Fragment, {}, slotContent)
  }
}