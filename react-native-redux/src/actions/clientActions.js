import { 
  CONNECT_SUCCESS,
  CONNECT_FAIL,
  DISCONNECT_SUCCESS,
  DISCONNECT_FAIL,
  NEW_MESSAGE_RECEIVED,
  USER_STATUS_UPDATED
} from '../constants';

const _connect = (client, userId, accessToken) => {
  return new Promise((resolve, reject) => {
    if (!userId) {
      reject('UserID is required.');
      return;
    }
    if (!accessToken) {
      reject('accessToken is required.');
      return;
    }

    if (!client) {
      reject('Channelize.io client was not created.');
    }

    client.connect(userId, accessToken, (error, res) => {
      if (error) {
        reject('Channelize.io connection Failed.');
      } else {
        resolve(res);
      }
    });
  });
};

export const chConnect = (client, userId, accessToken) => {
  return dispatch => {
    return _connect(client, userId, accessToken)
      .then(response => connectSuccess(dispatch, response))
      .catch(error => connectFail(dispatch, error));
  };
};

const connectSuccess = (dispatch, response) => {
  dispatch({
    type: CONNECT_SUCCESS,
    payload: response
  });
};

const connectFail = (dispatch, error) => {
  dispatch({
    type: CONNECT_FAIL,
    payload: error
  });
};

const _disconnect = (client) => {
  return new Promise((resolve, reject) => {
    if (client) {
      client.disconnect(() => {
        resolve(null);
      });
    } else {
      resolve(null);
    }
  });
};

export const chDisconnect = (client) => {
  return dispatch => {
    return _disconnect(client)
      .then(response => disconnectSuccess(dispatch, response))
      .catch(error => disconnectFail(dispatch, error));
  };
};

const disconnectSuccess = (dispatch, response) => {
  dispatch({
    type: DISCONNECT_SUCCESS,
    payload: response
  });
};

const disconnectFail = (dispatch, error) => {
  dispatch({
    type: DISCONNECT_FAIL,
    payload: error
  });
};

export const registerEventHandlers = (client) => {
  return dispatch => {
    client.chsocket.on('user.status_updated', function (payload) {
      dispatch({
        type: USER_STATUS_UPDATED,
        payload: payload
      });
    });

    client.chsocket.on('user.message_created', function (response) {
      dispatch({
        type: NEW_MESSAGE_RECEIVED,
        payload: response
      });
    });
  };
};