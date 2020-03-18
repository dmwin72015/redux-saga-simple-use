import { NAMESPACE_SEP } from './constants';
/* eslint-disable */
function prefix(obj, namespace) {
  return Object.keys(obj).reduce((memo, key) => {
    const newKey = `${namespace}${NAMESPACE_SEP}${key}`;
    memo[newKey] = obj[key];
    return memo;
  }, {});
}

export function prefixType(type, model) {
  const prefixedType = `${model.namespace}${NAMESPACE_SEP}${type}`;
  return prefixedType;
}

export function prefixNamespace(model) {
  const { namespace, reducers, effects } = model;
  if (reducers) {
    model.reducers = prefix(reducers, namespace, 'reducer');
  }
  if (effects) {
    model.effects = prefix(effects, namespace, 'effect');
  }
  return model;
}
