import { createStore, applyMiddleware, compose } from 'redux';

import thunk from 'redux-thunk';
import { logger } from 'redux-logger';
import { composeWithDevTools } from 'remote-redux-devtools';

import rootReducer from '../reducers';

const initialState = {};
const enhancers = [];
const middleware = [
  thunk,
];

let composeFunction = compose;

if (process.env.NODE_ENV === 'development') {
  composeFunction = composeWithDevTools;
  middleware.push(logger);
}

const composedEnhancers = composeFunction(
  applyMiddleware(...middleware),
  ...enhancers,
);

export const store = createStore(
  rootReducer,
  initialState,
  composedEnhancers
);
