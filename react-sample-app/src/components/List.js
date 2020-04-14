import React, { Component } from 'react';
import { connect } from 'react-redux';
import Utility from "../helpers/utility.js";
import { LANGUAGE_PHRASES, IMAGES } from "../constants";

class List extends Component {

	constructor(props) {
    super(props);
    this.utility = new Utility();
	}

	openConversationWindow = () => {
		this.props.openConversationWindow(this.props.conversation);
	}

	modifyLastMessage(message) {
    if(!message)
      return;

    // Set lastMessage of conersation
    if(message.isDeleted) {
      message.icon = null;
      message.body = "<i>" + LANGUAGE_PHRASES.MESSAGE_DELETED;
    }
    // For meta message
    else if(message.type !== "normal") {
      message.icon = null;
      message.body = "Admin Message";
    }
    else if(message.attachments && message.attachments.length) {

      switch(message.attachments[0].type) {
        case "image":
          message.icon = IMAGES.GALLERY_ICON;
          message.body = LANGUAGE_PHRASES.IMAGE;
          break;

        case "audio":
          message.icon = IMAGES.AUDIO_ICON;
          message.body = LANGUAGE_PHRASES.AUDIO;
          break;

        case "video":
          message.icon = IMAGES.GALLERY_ICON;
          message.body = LANGUAGE_PHRASES.VIDEO;
          break;

        case "location":
          message.icon = IMAGES.LOCATION_ICON;
          message.body = LANGUAGE_PHRASES.LOCATION;
          break;

        case "sticker":
          message.icon = IMAGES.STICKER_ICON;
          message.body = LANGUAGE_PHRASES.STICKER;
          break;

        case "gif":
          message.icon = IMAGES.GIF_ICON;
          message.body = LANGUAGE_PHRASES.GIF;
          break;

        case "text":
          message.icon = IMAGES.GALLERY_ICON;
          break;

        default:
          message.icon = IMAGES.GALLERY_ICON;
          message.body = LANGUAGE_PHRASES.ATTACHMENT;
      }
    }

    // Set Last Message time
    if(!message.createdAt) {
      message.time = this.utility.updateTimeFormat(Date());
    }
    else {
      message.time = this.utility.updateTimeFormat(message.updatedAt);
    }
    return message;
  }

	render() {
		let onlineIcon;
    let blockIcon;
		let messageData;

		// Handle new message
		if(this.props.newMessage && (this.props.newMessage.conversationId === this.props.conversation.id)) {
			messageData = this.modifyLastMessage(this.props.newMessage);
		}
		else {
			messageData = this.modifyLastMessage(this.props.conversation.lastMessage);
		}

    // Set block or online icon
    if(this.props.conversation.blockedByUser || this.props.conversation.blockedByMember) {
      blockIcon = <span className="ch-online-icon ch-user-blocked ch-show-element"></span>
    }
    else if(this.props.conversation.user && this.props.conversation.user.isOnline) {
      onlineIcon = <span className="ch-online-icon ch-show-element"></span>
    }

		return (
			<li id={this.props.conversation.id} onClick={this.openConversationWindow}>
				<div className="ch-conversation-image" style={{backgroundImage:`url(${this.props.conversation.profileImageUrl})`}}>
					{onlineIcon} {blockIcon}
				</div>
				<div id="ch_title">{this.props.conversation.title}</div>
				<div id="ch_created_at" className="ch-created-at">{messageData.time}</div>
				<div id="ch_last_msg_box" className="ch-last-msg-box">
					<div className="ch-last-message">{messageData.body}</div>
				</div>
			</li>
		);
	}
}

const mapStateToProps = (state) => {
  return {...state};
}

const mapDispatchToProps = (dispatch) => {
	return {
		openConversationWindow: (conversation) => { dispatch({type: "OPEN_CONVERSATION_WINDOW", conversation: conversation})}
	}
}

export default connect(mapStateToProps, mapDispatchToProps)(List)