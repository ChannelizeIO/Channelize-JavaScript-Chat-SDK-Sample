import { 
  LOADING_MESSAGE_LIST,
  MESSAGE_LIST_FAIL,
  MESSAGE_LIST_SUCCESS,
  SENDING_MESSAGE,
  SEND_MESSAGE_FAIL,
  SEND_MESSAGE_SUCCESS,
  LOADING_LOAD_MORE_MESSAGES,
  LOAD_MORE_MESSAGES_SUCCESS,
  LOAD_MORE_MESSAGES_FAIL,
  ACTIVE_CONVERSATION_SUCCESS,
  NEW_MESSAGE_RECEIVED
} from '../constants';
import { createReducer, uniqueList } from '../utils';

const INITIAL_STATE = {
  list: [],
  loading: false,
  error: null,
  loadingMoreMessage: false,
  allMessageLoaded: false,
  activeConversation: null
};

export const loadingMessageList = (state, action) => {
  state.loading = true;
};

export const messageListSuccess = (state, action) => {
  state.loading = false;
  state.list = action.payload;
};

export const messageListFail = (state, action) => {
  state.loading = false;
  state.error = action.payload;
};

export const loadingLoadMoreMessages = (state, action) => {
  state.loadingMoreMessage = true;
};

export const loadMoreMessagesFail = (state, action) => {
  state.loadingMoreMessage = false;
  state.error = action.payload;
};

export const loadMoreMessagesSuccess = (state, action) => {
  state.loadingMoreMessage = false;
  if (!action.payload.length) {
    state.allMessageLoaded = true;
  } else {
    state.list = [...state.list, ...action.payload];
    state.list = uniqueList(state.list);
  }
};

export const sendingMessage = (state, action) => {
  action.payload.status = "pending";
  state.list = [...[action.payload], ...state.list];
  state.list = uniqueList(state.list);
};

export const sendMessageSuccess = (state, action) => {
  state.list = [...[action.payload], ...state.list];
  state.list = uniqueList(state.list);
};

export const sendMessageFail = (state, action) => {
  action.payload.status = "failed";
  state.list = [...[action.payload], ...state.list];
  state.list = uniqueList(state.list);
};

export const activeConversationSuccess = (state, action) => {
  state.activeConversation = action.payload;
};

export const newMessageReceived = (state, action) => {
  let message = action.payload.message;
  if (state.activeConversation.id == message.conversationId) {
    state.list = [...[message], ...state.list];
    state.list = uniqueList(state.list);
  }
};

export const handlers = {
  [LOADING_MESSAGE_LIST]: loadingMessageList,
  [MESSAGE_LIST_SUCCESS]: messageListSuccess,
  [MESSAGE_LIST_FAIL]: messageListFail,
  [SENDING_MESSAGE]: sendingMessage,
  [SEND_MESSAGE_SUCCESS]: sendMessageSuccess,
  [SEND_MESSAGE_FAIL]: sendMessageFail,
  [LOADING_LOAD_MORE_MESSAGES]: loadingLoadMoreMessages,
  [LOAD_MORE_MESSAGES_SUCCESS]: loadMoreMessagesSuccess,
  [LOAD_MORE_MESSAGES_FAIL]: loadMoreMessagesFail,
  [ACTIVE_CONVERSATION_SUCCESS]: activeConversationSuccess,
  [NEW_MESSAGE_RECEIVED]: newMessageReceived
};

export default createReducer(INITIAL_STATE, handlers);