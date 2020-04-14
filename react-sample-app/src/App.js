import React, { Component } from 'react';
import Widget from './components/Widget';

class App extends Component {

  render() {
    return <Widget publicKey={this.props.publicKey} userId={this.props.userId} accessToken={this.props.accessToken}/>
  }
}

export default App;
