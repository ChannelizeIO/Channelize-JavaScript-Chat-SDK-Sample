import { 
  LOADING_CONVERSATION_LIST,
  CONVERSATION_LIST_FAIL,
  CONVERSATION_LIST_SUCCESS,
  LOADING_ACTIVE_CONVERSATION,
  ACTIVE_CONVERSATION_FAIL,
  ACTIVE_CONVERSATION_SUCCESS
} from '../constants';

export const getConversationList = (conversationListQuery) => {
  return dispatch => {
    dispatch({
      type: LOADING_CONVERSATION_LIST,
      payload: {}
    });
    return conversationListQuery.list((err, response) => {
      if (err) {
        dispatch({
          type: CONVERSATION_LIST_FAIL,
          payload: error
        });
      }
      dispatch({
        type: CONVERSATION_LIST_SUCCESS,
        payload: response
      }); 
    })
  };
};

export const getActiveConversation = (client, {userId, conversationId}) => {
  let conversationListQuery = client.Conversation.createConversationListQuery();
  if (userId) {
    conversationListQuery.membersExactly = userId;
    conversationListQuery.isGroup = false;
  }

  if (conversationId) {
    conversationListQuery.ids = conversationId;
  }

  return dispatch => {
    dispatch({
      type: LOADING_ACTIVE_CONVERSATION,
      payload: {}
    });
    return conversationListQuery.list((err, conversations) => {
      if (err) {
        return dispatch({
          type: ACTIVE_CONVERSATION_FAIL,
          payload: error
        });
      }

      if (conversations.length) {
        return dispatch({
          type: ACTIVE_CONVERSATION_SUCCESS,
          payload: conversations[0]
        });
      }

      client.User.get(userId, (err, user) => {
        return dispatch({
          type: ACTIVE_CONVERSATION_SUCCESS,
          payload: {isGroup: false, user}
        });
      })
    })
  };
};
