import React, { Component } from 'react';
import { Provider } from 'react-redux';

import { store } from './src/store';
import Connect from './src/components/Connect';
import ConversationWindow from './src/components/ConversationWindow';
import { Channelize } from 'channelize-websdk/dist/index';

if (process.env.NODE_ENV === 'development') {
  GLOBAL.XMLHttpRequest = GLOBAL.originalXMLHttpRequest || GLOBAL.XMLHttpRequest;
  console.disableYellowBox = true;
}

//PUBLIC_KEY => Channelize.io public key
//LOGGEDIN_USER_ID => User id of loggedin user
//CH_ACCESS_TOKEN => Channelize access token of loggedin userid 
//ANOTHER_USER_ID => The user id of another user to start chat

export default class App extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    console.log('app is launched');
  }

  componentWillUnmount() {
    console.log('app is killed');
  }

  render() {
    var client = new Channelize.client({publicKey: "PUBLIC_KEY"});

    return (
      <Provider store={store}>
        <Connect client={client} userId={LOGGEDIN_USER_ID} accessToken={CH_ACCESS_TOKEN}>
          <ConversationWindow userId={ANOTHER_USER_ID}/>
        </Connect>
      </Provider>
    );
  }
}
