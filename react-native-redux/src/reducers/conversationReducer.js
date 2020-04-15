import { 
  LOADING_ACTIVE_CONVERSATION,
  ACTIVE_CONVERSATION_FAIL,
  ACTIVE_CONVERSATION_SUCCESS,
  USER_STATUS_UPDATED
} from '../constants';
import { createReducer } from '../utils';

const INITIAL_STATE = {
  list: [],
  activeConversation: null,
  loading: false,
  error: null
};

export const loadingActiveConversation = (state, action) => {
  state.loading = true;
};

export const activeConversationSuccess = (state, action) => {
  state.loading = false;
  state.activeConversation = action.payload;
};

export const activeConversationFail = (state, action) => {
  state.loading = false;
  state.error = action.payload;
};

export const userStatusUpdated = (state, action) => {
  // const user = action.payload.user;
  // if (user.id == state.activeConversation.user.id) {
  //   state.activeConversation.user = user;
  //   // state.activeConversation = {...state.activeConversation};
  // }
};

export const handlers = {
  [LOADING_ACTIVE_CONVERSATION]: loadingActiveConversation,
  [ACTIVE_CONVERSATION_FAIL]: activeConversationFail,
  [ACTIVE_CONVERSATION_SUCCESS]: activeConversationSuccess,
  [USER_STATUS_UPDATED]: userStatusUpdated
};

export default createReducer(INITIAL_STATE, handlers);