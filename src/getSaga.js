import invariant from 'invariant';
import * as sagaEffects from 'redux-saga/effects';
import { prefixType } from './prefix';

// create effect
function createEffects(model) {
  function assertAction(type, name) {
    invariant(type, `${name} ,dispatch: action should be a plain Object with type`);
  }
  function put(action) {
    const { type } = action;
    assertAction(type, 'sagaEffects.put');
    return sagaEffects.put({ ...action, type: prefixType(type, model) });
  }

  function putResolve(action) {
    const { type } = action;
    assertAction(type, 'sagaEffects.put.resolve');
    return sagaEffects.put.resolve({
      ...action,
      type: prefixType(type, model)
    });
  }
  put.resolve = putResolve;

  function take(type) {
    if (typeof type === 'string') {
      assertAction(type, 'sagaEffects.take');
      return sagaEffects.take(prefixType(type, model));
    }
    if (Array.isArray(type)) {
      return sagaEffects.take(
        type.map(t => {
          if (typeof t === 'string') {
            assertAction(t, 'sagaEffects.take');
            return prefixType(t, model);
          }
          return t;
        })
      );
    }
    return sagaEffects.take(type);
  }
  return { ...sagaEffects, put, take };
}

// key => actionType
function getWatcher(actionType, effectSrc, model) {
  let effect = effectSrc;
  let effectType = 'takeEvery';
  let ms;

  if (Array.isArray(effectSrc)) {
    [effect] = effectSrc;
    const option = effectSrc[1];
    if (option && option.type) {
      effectType = option.type;
      if (effectType === 'throttle') {
        invariant(option.ms, 'option.ms should be defined if type is throttle');
        ms = option.ms;
      }
    }
    invariant(
      ['takeEvery', 'takeLatest', 'throttle'].includes(effectType),
      'effect type should be takeEvery, takeLatest, or throttle'
    );
  }

  const noop = () => {};
  const sagaWithPromise = function* sagaWithPromise(action) {
    // todo: 到时候可以给action增加一个字段，可以在错误时不弹出错误框
    const { __resolve__ = noop, __reject__ = noop } = action;
    try {
      // 直接yield原来的saga即可
      yield effect(action, createEffects(model), model);
      __resolve__();
    } catch (e) {
      __reject__(e);
    }
  };

  switch (effectType) {
    case 'takeLatest':
      return function*() {
        yield sagaEffects.takeLatest(actionType, sagaWithPromise);
      };
    case 'throttle':
      return function*() {
        yield sagaEffects.throttle(ms, actionType, sagaWithPromise);
      };
    default:
      return function*() {
        yield sagaEffects.takeEvery(actionType, sagaWithPromise);
      };
  }
}

export default function getSaga(model) {
  const { effects } = model;
  return function*() {
    // eslint-disable-next-line no-restricted-syntax
    for (const key in effects) {
      if (Object.prototype.hasOwnProperty.call(effects, key)) {
        const watcher = getWatcher(key, effects[key], model);
        yield sagaEffects.fork(watcher);
      }
    }
  };
}
