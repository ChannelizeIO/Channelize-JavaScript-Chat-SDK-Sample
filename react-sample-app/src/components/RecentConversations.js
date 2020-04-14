import React, { Component } from 'react';
import Header from "./Header";
import List from "./List";
import Loader from "./Loader";
import Utility from "../helpers/utility.js";
import { LANGUAGE_PHRASES, IMAGES } from "../constants";
import { connect } from 'react-redux';

class RecentConversations extends Component {

  constructor(props) {
    super(props);
    this.utility = new Utility();
    this.limit = 25;
    this.skip = 0;
  }

  componentDidMount() {
    // Get login user details
    this.props.chAdapter.getUser(this.props.userId, (err, user) => {
    if(err) return console.error(err);

    this.user = user;
    });

    // Get recent conversations of user
    this.props.chAdapter.getConversationsList(this.limit, this.skip, null, "members", null, null, null, null, null, (err, conversations) => {
      if(err) return console.error(err);

      this.props.loadRecentConversations(conversations);
    });
  }

  modifyConversation(conversation) {
    if (!conversation.isGroup && Object.entries(conversation.user).length === 0) {
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
      if(!member) {
        conversation.blockedByMember = true;
        conversation.status = "";
      }
      else {
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
    }
    conversation.isModified = true;
    return conversation;
  }

  render() {
    let headerImg = "";
    if(this.user && this.user.profileImageUrl) {
      headerImg = <div className="ch-header-image" style={{backgroundImage:`url(${this.user.profileImageUrl})`}}></div>
    }
    else {
      headerImg = <div className="ch-header-image" style={{backgroundImage:`url(${IMAGES.AVTAR})`}}></div>
    }
    return (
      <div id="ch_recent_window" className="ch-recent-window">
        <Header headerImg={headerImg} title={LANGUAGE_PHRASES.CHAT} openOptionDocker={true} showCloseBtn={true} closeFunction={this.props.closeWindow}>
          <i id="ch_search" className="material-icons ch-search-icon" onClick={this.props.openSearchWindow}>search</i>
        </Header>

        <div id="ch_recent_listing" className="ch-recent-listing">
          {this.props.recentConversations.length || this.props.friendId ? 
            <ul id="ch_recent_ul" className="ch-recent-ul">
              {
                this.props.recentConversations.map((conversation) => {
                  conversation = this.modifyConversation(conversation);
                  return <List key={conversation.id} conversation={conversation} />
                })
              }
            </ul>
            : <Loader />
          }
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {...state};
}

const mapDispatchToProps = (dispatch) => {
  return {
    loadRecentConversations: (conversations) => { dispatch({type: "LOAD_RECENT_CONVERSATIONS", conversations: conversations})},
    openSearchWindow: () => { dispatch({type: "OPEN_SEARCH_WINDOW"})},
    closeWindow: () => { dispatch({type: "CLOSE_WINDOW", isRecentWindowOpen: false})}
  }
}
              
export default connect(mapStateToProps, mapDispatchToProps)(RecentConversations);