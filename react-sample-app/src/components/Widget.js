import React, { Component } from 'react';
import RecentConversations from './RecentConversations';
import ConversationWindow from './ConversationWindow';
import SearchWindow from './SearchWindow';
import { connect } from 'react-redux';
import ChannelizeAdapter from "../adapter.js";
import { updateUserStatus, blockStatus } from "../actions/listeners.js";
import { IMAGES } from "../constants";

class Widget extends Component {

  constructor(props) {
    super(props);

    this._connectWithUserId(this.props.userId, this.props.accessToken);
    this._registerChEventHandlers();
  }

   _connectWithUserId(userId, accessToken) {
    let chAdapter = new ChannelizeAdapter(this.props.publicKey);
    chAdapter.connect(userId, accessToken, (err, res) => {
      if(err) return console.error(err);

      this.props.setConnected(chAdapter, userId, true);
    });
  }

  render() {
    if(!this.props.isConnected) {
      return null;
    }

    return (
      <div>
        <div id="ch_launcher" className="ch-launcher" onClick={this.props.showWidget}>
          <img id="ch_launcher_image" className="ch-launcher-image" src={IMAGES.LAUNCHER_ICON} alt="" />
        </div>
        {this.props.isShowWidget &&
          <div id="ch_frame" className="ch-frame">
            {this.props.isRecentWindowOpen && <RecentConversations />}
            {this.props.openConversation && <ConversationWindow isOpen={true}/>}
            {this.props.isSearchWindowOpen && <SearchWindow />}
          </div>
        }
      </div>
    );
  }

  // Handle all real time events of JS-SDK
  _registerChEventHandlers() {
    // Handle new message
    window.channelize.chsocket.on('user.message_created', (data) => {

      // Update last message of respected conversation
      if(this.props.openConversation && this.props.openConversation.id === data.message.conversationId) {
        this.props.openConversation.lastMessage = data.message;
      }

      // Update last message and messages of respective conversation
      const conversationObject = this.props.recentConversations.find(conv => conv.id === data.message.conversationId);

      if(conversationObject) {
        conversationObject.lastMessage = data.message;
        conversationObject.messages = conversationObject.messages ? conversationObject.messages : [];
        conversationObject.messages.push(data.message);

        // Update conversation list sequence
        let updatedConversations = [conversationObject];
        let conversations = this.props.recentConversations.filter(conv => conv.id !== conversationObject.id);
        updatedConversations = updatedConversations.concat(conversations);

        this.props.handleNewMessage(updatedConversations, this.props.openConversation, data.message);
      }
      else {
        window.chAdapter.getConversation(data.message.conversationId, (err, conversation) => {
          if(err) return console.error(err);

          // Update conversation list sequence
          let updatedConversations = [conversation];
          let conversations = this.props.recentConversations.filter(conv => conv.id !== conversation.id);
          updatedConversations = updatedConversations.concat(conversations);

          this.props.handleNewMessage(updatedConversations, this.props.openConversation, data.message);
        });
      }
    });

    // Handle mark as read
    window.channelize.chsocket.on('conversation.mark_as_read', (data) => {
      this.props.updateConversationStatus(data);
    });

    // Handle user online/ofline status
    window.channelize.chsocket.on('user.status_updated', (data) => {
      this.props.updateStatus(data.user);
    });

    // Handle user block
    window.channelize.chsocket.on('user.blocked', (data) => {
      this.props.updateBlockStatus(data, "block");
    });

    // Handle user unblock
    window.channelize.chsocket.on('user.unblocked', (data) => {
      this.props.updateBlockStatus(data, "unblock");
    });
  }
}

const mapStateToProps = (state) => {
  return {...state}
}

const mapDispatchToProps = (dispatch) => {
  return {
    handleNewMessage: (recentConversations, conversation, message) => {
      dispatch({
        type: "HANDLE_NEW_MESSAGE",
        recentConversations: recentConversations,
        conversation: conversation,
        message: message
      })
    },
    setConnected: (chAdapter, userId, isConnected) => { dispatch({type: "HANDLE_CONNECTION", chAdapter: chAdapter, userId: userId, isConnected: true})},
    showWidget: (value) => { dispatch({type: "SHOW_WIDGET", isShowWidget: value})},
    updateStatus: (user) => {dispatch(updateUserStatus(user))},
    updateBlockStatus: (user, action) => {dispatch(blockStatus(user, action))},
    updateConversationStatus: (data) => {dispatch({type: "UPDATE_READ_STATUS", conversation: data.conversation, user: data.user})}
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Widget);