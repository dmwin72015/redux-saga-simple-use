import invariant from 'invariant';
import { isArray, isFunction, isPlainObject } from './util';

export default function checkModel(model, existModels) {
  const { namespace, reducers, effects } = model;

  // namespace 必须被定义
  invariant(namespace, `${namespace} ,model namespace should be defined`);
  // 并且是字符串
  invariant(typeof namespace === 'string', `[app.model] namespace should be string, but got ${typeof namespace}`);
  // 并且唯一
  invariant(!existModels.some(m => m.namespace === namespace), `[app.model] namespace should be unique`);

  // state 可以为任意值
  // reducers 可以为空，PlainObject 或者数组
  if (reducers) {
    invariant(
      isPlainObject(reducers) || isArray(reducers),
      `[app.model] reducers should be plain object or array, but got ${typeof reducers}`
    );
    // 数组的 reducers 必须是 [Object, Function] 的格式
    invariant(
      !isArray(reducers) || (isPlainObject(reducers[0]) && isFunction(reducers[1])),
      `[app.model] reducers with array should be [Object, Function]`
    );
  }

  // effects 可以为空，PlainObject
  if (effects) {
    invariant(isPlainObject(effects), `[app.model] effects should be plain object, but got ${typeof effects}`);
  }
}
