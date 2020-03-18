import invariant from 'invariant';

const identify = () => {};

function handleAction(actionType, reducer = identify) {
  return (state, action) => {
    const { type } = action || {};
    invariant(type, 'dispatch: action should be a plain Object with type');
    if (actionType === type) {
      return reducer(state, action);
    }
    return state;
  };
}

function reduceReducers(...reducers) {
  return (previous, current) => reducers.reduce((p, r) => r(p, current), previous);
}

function handleActions(handlers, defaultState) {
  const reducers = Object.keys(handlers).map(type => handleAction(type, handlers[type]));
  // currentAction当前调用的action
  // fn 为当前执行action的函数，p为state 累积的state， 是为了保持state的完整性
  // 例如 在定义的reducer中可以 return { a:'xx'}, 而不必 return { ...state , a: 'xx'};
  // 普通的reducer中，如果直接返回 {a: 'xx'}，对导致state的其他数据丢失。
  const reducer = reduceReducers(...reducers);
  return (state = defaultState, action) => {
    return reducer(state, action);
  };
}

export function getReducer(model) {
  const { reducers = {}, state } = model;
  return handleActions(reducers, state);
}

// export default function aggretReducers(args) {
//   console.log(args);
//   return (state, action) => {
//     console.log('??? 调用');
//     console.log(state, action);
//     return {};
//   };
// }
