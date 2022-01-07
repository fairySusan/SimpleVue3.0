import {camelize, toHandlerKey} from '../shared/index'
export function emit(instance,event:string, ...rawArgs) {
  /*
    <MyComponent @myEvent="onMyEvent"></MyComponent> 
   */
  const props = instance.props
  const handlerName = toHandlerKey(camelize(event))
  const handler = props[handlerName]
  if(handler) {
    handler(...rawArgs)
  }
}