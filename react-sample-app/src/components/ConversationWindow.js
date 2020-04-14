import React, { Component } from 'react';
import Header from "./Header";
import Loader from "./Loader";
import Message from "./Message";
import Utility from "../helpers/utility.js";
import { connect } from 'react-redux';
import { LANGUAGE_PHRASES, IMAGES } from "../constants";

class ConversationWindow extends Component {

	constructor(props) {
    super(props);
    this.utility = new Utility();
    this.limit = 25;
    this.skip = 0;
    this.loadCount = 0;
    this.inputValue = null;

    this.handleChange = this.handleChange.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.onScroll = this.onScroll.bind(this);
  }

  componentDidMount() {
    if(this.props.openConversation && !this.props.openConversation.isDummyObject) {
      // Conversation mark as read
      this._markAsRead(this.props.openConversation);

      // Get conversation messages
      this.loadMessages(this.props.openConversation, this.limit, this.skip, (err, messages) => {
        if(err) return console.error(err);

        this.props.loadMessagesToStore(this.props.openConversation.id, messages, true);
      });
    }
    else {
      this.props.loadMessagesToStore(this.props.openConversation.id, [], false);
    }
  }

  componentDidUpdate(prevProps) {

    // Escape dummy conversation
    if(this.props.openConversation && this.props.openConversation.isDummyObject) {
      this.props.loadMessagesToStore(this.props.openConversation.id, [], true);
      return;
    }

  	// Load messages
  	if(this.props.openConversation && prevProps.openConversation && prevProps.openConversation.id !== this.props.openConversation.id) {
  		this.props.loadMessagesToStore(this.props.openConversation.id, [], false);
  		this.loadMessages(this.props.openConversation, this.limit, this.skip, (err, messages) => {
        this.props.loadMessagesToStore(this.props.openConversation.id, messages, true);
  		});
  	}

  	// Scroll to last message
  	let messagesBox = document.getElementById("ch_messages_box");
    if(messagesBox) {
      messagesBox.scrollTop = messagesBox.scrollHeight;

      // Set first message
      this.firstMessage = messagesBox.childNodes[0];
    }
  }

  _markAsRead(conversation) {
    let currentDate = new Date();
    let timestamp = currentDate.toISOString();
    this.props.chAdapter.markAsReadConversation(conversation, timestamp, (err, res) => {
      if(err) return console.error(err);
    });
  }

  loadMessages(conversation, limit, skip, cb) {
  	this.props.chAdapter.getMessages(conversation, limit, skip, null, null, null, null, (err, messages) => {
			if(err) return cb(err);

			cb(null, messages.reverse());
		});
  }

  handleChange(event) {
  	if(event.keyCode === 13) {
  		event.preventDefault();
  		this.sendMessage();
  		event.target.value = "";
  	}
  	this.inputValue = event.target.value;
  }

  sendMessage() {
    if(this.props.openConversation.isDummyObject) {
      let data = {
        type : "normal",
        userId : this.props.openConversation.userId,
        body : this.inputValue
      }

      this.props.chAdapter.sendMessageToUser(data, (err, res) => {
        if(err) return console.error(err);
      });
    }
    else {
      let data = {
        type : "normal",
        body : this.inputValue
      }

      this.props.chAdapter.sendMessage(this.props.openConversation, data, (err, message) => {
        if(err) console.error(err);

      });
    }
  }

  onScroll() {
  	if(this.props.showMessages && document.getElementById("ch_messages_box").scrollTop === 0) {
	  	let messagesBox = document.getElementById("ch_messages_box");
	  	let firstMessage = messagesBox.childNodes[0] ? messagesBox.childNodes[0] : "";

  		++this.loadCount;
			this.skip = this.loadCount * this.limit;

			// Load more messages
  		this.loadMessages(this.props.openConversation, this.limit, this.skip, (err, messages) => {
  			if(err) return console.error(err);

  			let allMessages = messages.concat(this.props.openConversation.messages)
        this.props.loadMessagesToStore(this.props.openConversation.id, allMessages, true);

  			// Scroll to new message
  			firstMessage.scrollIntoView();
  		});
  	}
  }

  modifyConversation(conversation) {
    if(!conversation || conversation.isDummyObject)
      return conversation;

    if (!conversation.isGroup && conversation.user && Object.entries(conversation.user).length === 0) {
      conversation.title = LANGUAGE_PHRASES.DELETED_MEMBER;
      conversation.profileImageUrl = IMAGES.AVTAR;
      return conversation;
      }

      // Set profile Image, title and status of conversation
    if(conversation.isGroup) {
      conversation.profileImageUrl = conversation.profileImageUrl ? conversation.profileImageUrl : IMAGES.GROUP;
      conversation.status = conversation.memberCount + " " + LANGUAGE_PHRASES.MEMBERS;
    }
    else {
      conversation.profileImageUrl = conversation.user.profileImageUrl ? conversation.user.profileImageUrl : IMAGES.AVTAR;
      conversation.title = conversation.user.displayName;

      // Set block user status
      let member = conversation.members.find(member => member.userId === conversation.user.id);
      conversation.blockedByMember = member ? false : true;

      if(!conversation.isActive) {
        conversation.blockedByUser = true;
      }

      if(conversation.user.isOnline) {
        conversation.status = LANGUAGE_PHRASES.ONLINE;
      }
      else {
        conversation.status = LANGUAGE_PHRASES.LAST_SEEN + this.utility.updateTimeFormat(member.user.lastSeen);
      }
    }
    return conversation;
  }

  _modifyMessage(message) {
    if(!message) {
      return message;
    }

    // Set read status of message
    if(!this.props.openConversation.isDummyObject) {
     message.readByAll = this.props.chAdapter.readByAllMembers(this.props.openConversation, message);
    }

    message.time = this.utility.updateTimeFormat(message.createdAt);

    if(message.isDeleted) {
      message.body = "<i>" + LANGUAGE_PHRASES.MESSAGE_DELETED;
    }
    return message;
  }

  blockUser() {
    this.props.chAdapter.blockMember(this.props.openConversation.user.id, (err, res) => {
      if(err) return console.error(err);
    });
  }

  unblockUser() {
    this.props.chAdapter.unblockMember(this.props.openConversation.user.id, (err, res) => {
      if(err) return console.error(err);
    });
  }

  render() {
    let conversation = this.modifyConversation(this.props.openConversation);
    let messages = this.props.openConversation.messages ? this.props.openConversation.messages : [];
    let headerImg = <div className="ch-header-image" style={{backgroundImage:`url(${conversation.profileImageUrl})`}}></div>

    let actionButton;
    if(conversation.blockedByUser || conversation.blockedByMember) {
      actionButton = <div id="ch_conv_unblock" onClick={() => this.unblockUser()}>Unblock User</div>
    }
    else {
      actionButton = <div id="ch_conv_block" onClick={() => this.blockUser()}>Block User</div>
    }

		return (
  		<div id="ch_conv_window" className="ch-conv-window">
  			<Header headerImg={headerImg} title={conversation.title} status={conversation.status} showDropDown={false} showCloseBtn={true} closeFunction={this.props.closeWindow}>
  				<div id="ch_conv_drop_down" className="ch-conv-drop-down">
  					{actionButton}
					</div>
  			</Header>

  			<div id="ch_messages_box" className="ch-messages-box" onScroll={this.onScroll}>
  				{this.props.showMessages ?
  					messages.map(message => {
              message = this._modifyMessage(message);
              return <Message key={message.id} message={message} loginUserId="20697"/>
            })
  					: <Loader /> }
  			</div>

  			<div id="ch_send_box" className="ch-send-box">
  				<textarea id="ch_input_box" className="ch-input-box" type="text" placeholder="Send a message" onKeyUp={this.handleChange}></textarea>

					<i id="ch_attachment_btn" title="Send Attachments" className="material-icons ch-attachment-btn">attachment</i>
					<button id="ch_send_button" className="ch-send-button" onClick={this.sendMessage}><i className="ch-send-icon material-icons">send</i></button>
  			</div>
  		</div>
		);
  }
}

const mapStateToProps = (state) => {
  return {...state}
}

const mapDispatchToProps = (dispatch) => {
  return {
    loadMessagesToStore: (convId, messages, showMessages) => { dispatch({type: "LOAD_MESSAGES", conversationId: convId, messages: messages, showMessages: showMessages})},
    markAsReadConversation: (conversationId) => { dispatch({type: "MARK_AS_READ", conversationId: conversationId})},
    closeWindow: () => { dispatch({type: "CLOSE_WINDOW", openConversation: null, showMessages: false, messages: []})},
	}
}

export default connect(mapStateToProps, mapDispatchToProps)(ConversationWindow);