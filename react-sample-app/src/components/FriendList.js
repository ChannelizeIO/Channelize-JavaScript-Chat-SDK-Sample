import React, { Component } from 'react';
import { connect } from 'react-redux';
import { IMAGES } from "../constants";

class FriendList extends Component {

  openConversationWindow(member) {
    // Get conversation
    this.props.chAdapter.getConversationsList(1, 0 , member.id, "members", null, null, null, null, null, (err, conversation) => {
      if(err) return console.error(err);

      if(conversation.length) {
        // Get conversation messages
        this.props.openMemberConversation(conversation[0], []);
      }
      else {
        let dummyConversation = {
          id: "12345",
          userId: member.id,
          profileImageUrl: member.profileImageUrl ? member.profileImageUrl : IMAGES.AVTAR,
          title: member.displayName,
          isGroup: false,
          isDummyObject: true,
          user : member
        }

        this.props.openMemberConversation(dummyConversation, []);
      }
    });
  }

  render() {
  	const imgUrl = this.props.friend.profileImageUrl ? this.props.friend.profileImageUrl : IMAGES.AVTAR;
  	return (
  		<li id={this.props.friend.id} className="ch-friends-list" onClick={() => this.openConversationWindow(this.props.friend)}>
  			<img id="ch_contact_img" className="ch-contact-img" src={imgUrl} alt="" />
  			<div id="ch_friend_name" className="ch-friend-name">{this.props.friend.displayName}</div>
  		</li>
		);
  }
}

const mapDispatchToProps = (dispatch) => {
	return {
    openMemberConversation: (conversation) => { dispatch({type: "OPEN_CONVERSATION_WINDOW", conversation: conversation})}
	}
}

export default connect(null, mapDispatchToProps)(FriendList)