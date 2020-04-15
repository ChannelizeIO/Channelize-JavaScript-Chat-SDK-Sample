import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ConnectContext } from '../context';
import { chConnect, registerEventHandlers } from '../actions';
import { connect } from 'react-redux';

class Connect extends Component {
  static propTypes = {
    /** The Channelize.io client object */
    client: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      connected: false
    };
  }

  componentDidMount() {
    const { client, userId, accessToken } = this.props;
    this.props.chConnect(client, userId, accessToken);
  }

  componentDidUpdate(prevProps) {
    if (!this.props.connected) {
      return;
    }

    // Register real time events after successful connection
    if (!prevProps.connected && this.props.connected) {
      this.props.registerEventHandlers(this.props.client)
    }
  }

  getContext = () => ({
    client: this.props.client
  })

  render() {
    const { connected } = this.props;
    return (
      <ConnectContext.Provider value={this.getContext()}>
        { connected && this.props.children }
      </ConnectContext.Provider>
    );
  }
};

function mapStateToProps({ client }) {
  const { connected, error } = client;
  return { error, connected };
}

export default connect(
  mapStateToProps,
  { chConnect, registerEventHandlers }
)(Connect);
