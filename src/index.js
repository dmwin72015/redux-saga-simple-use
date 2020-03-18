import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import createSagaMiddleware from 'redux-saga';

import getSaga from './getSaga';
import { prefixNamespace } from './prefix';
import { getReducer } from './getReducer';
import checkModel from './checkModel';

const promiseMiddleware = () => next => action => {
  return new Promise((resolve, reject) => {
    next({
      ...action,
      __resolve__: resolve,
      __reject__: reject
    });
  });
};

export default function initStore(models) {
  if (!models || !models.length) {
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    models.reduce((prev, e) => {
      checkModel(e, prev);
      return prev.concat(e);
    }, []);
  }

  const app = {
    nsModel: models.map(m => prefixNamespace(m))
  };

  const rootState = {};
  const allReducers = {};
  const allSagas = [];

  app.nsModel.forEach(m => {
    allReducers[m.namespace] = getReducer(m);
    rootState[m.namespace] = m.state;
    if (m.effects) {
      allSagas.push(getSaga(m));
    }
  });

  return function configureStore(initialState) {
    const sagaMiddleware = createSagaMiddleware();
    const store = createStore(
      combineReducers(allReducers),
      initialState || rootState,
      compose(applyMiddleware(promiseMiddleware, sagaMiddleware))
    );

    store.sagaTaskList = allSagas.map(ele => sagaMiddleware.run(ele));
    // eslint-disable-next-line no-empty-function
    store.sagaTask = sagaMiddleware.run(function*() {});
    return store;
  };
}
