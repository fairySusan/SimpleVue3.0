export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    setElementText: hostSetElementText,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setText: hostSetText,
    createText: hostCreateText
  } = options

  const render = (vnode, container) => {
    patch(null, vnode, container)
  }

  function patch(
    n1,
    n2,
    container = null,
    anchor = null,
    parentComponent = null
  ) {
    // 基于 n2 的类型来判断
    // 因为 n2 是新的 vnode
    
  }
}