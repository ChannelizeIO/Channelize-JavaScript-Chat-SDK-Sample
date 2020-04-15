import { combineReducers } from 'redux';
import messageReducer from './messageReducer';
import clientReducer from './clientReducer';
import conversationReducer from './conversationReducer';

export default combineReducers({
  message: messageReducer,
  conversation: conversationReducer,
  client: clientReducer
});
